class Node {
    /**
     * 
     * @param {Node[]} parents 
     */
    constructor(parents) {
        /** @type {Node[]} */
        this.parents = parents;
    }
    clonewithnewparents(newparents) {
        throw new Error("not implemented");
    }

    /**
     * @returns {Node[]} sorted nodes with root at the end
     */
    topologicalsort() {

        const stack = new Set();
        //this it named stack because i use it as a stack. i need a set for the O(1) lookup if a node is already on it
        //with a list it would also work but slower

        const onpath = new Set();//this is needed for cycle detection only

        function visit(node) {
            if (stack.has(node)) return;
            if (onpath.has(node)) throw new Error("oh no, the graph has a cycle. fix it!! because a expression should never have cycles");
            onpath.add(node);

            for (let parent of node.parents) {
                visit(parent);
            }

            onpath.delete(node);
            stack.add(node);
        }
        visit(this);
        return [...stack];


    }

    /**
     * Deeply clones this node and its parents, with optional custom replacements.
     *
     * @param {function(Node, Node): Node} [replaceFn]
     *   A function called for each node with two arguments:
     *     - `node`: the original node being visited
     *     - `clone`: copy of node with replaced parents
     *   Should return a replacement node, or `undefined`/`null` to use the clone.
     *
     * @param {Map<Node, Node>} [mapping=new Map()]
     *   Cache of already cloned nodes to handle shared parents and avoid duplicate copies.
     *
     * @returns {Node} The cloned (or replaced) node corresponding to this node.
     *
     * @example
     * const newRoot = oldRoot.copyGraph((original, lazyClone) => {
     *   if (original instanceof VisualizationTarget) {
     *     return new LabelNode(lazyClone(), original.name);
     *   }
     *   return undefined;
     * });
     */
    copyGraph(replaceFn = ((original, clone) => undefined), mapping = new Map()) {
        if (mapping.has(this)) return mapping.get(this);
        const clone = this.clonewithnewparents(this.parents.map(p => p.copyGraph(replaceFn, mapping)));
        const newNode = replaceFn(this, clone) ?? clone;
        mapping.set(this, newNode);
        return newNode;
    }
    copyGraphLazy(replaceFn = ((original, lazyClone) => undefined), mapping = new Map()) {
        if (mapping.has(this)) return mapping.get(this);

        const lazyClone = () => {
            const clonedParents = this.parents.map(p => p.copyGraphLazy(replaceFn, mapping));
            return this._cloneWithNewParents(clonedParents);
        };

        const newNode = replaceFn(this, lazyClone) ?? lazyClone();

        mapping.set(this, newNode);
        return newNode;
    }

    /**
     * Recursively visits all nodes in the graph.
     *
     * @template T
     * @param {(node: Node, parentResults: T[], cache: Map<Node, T>) => T} visitorfn
     *   A function applied to each node.
     * @param {Map<Node, T>} [resultscache=new Map()]
     *   Optional cache to store results for nodes.
     * @returns {T} The result of visiting this node.
     */
    visitnodesrec(visitorfn, resultscache = new Map()) {
        function visit(node) {
            if (resultscache.has(node)) return resultscache.get(node);
            const parentresults = node.parents.map(p => visit(p));
            const result = visitorfn(node, parentresults, resultscache);
            resultscache.set(node, result);
            return result;
        }
        return visit(this);
    }

    eval(variables = new Map(), cache = new Map()) {
        return this.visitnodesrec((node, parentResults) => {
            return node.compute(parentResults, variables);
        });
    }

    countchildren() {
        const nodes = this.topologicalsort();
        const numberOfChildren = new Map();
        for (const node of nodes) {
            for (const parent of node.parents) {
                numberOfChildren.set(parent, (numberOfChildren.get(parent) ?? 0) + 1);
            }
        }
        return numberOfChildren;
    }
    


}
class ExpressionNode extends Node {

    /**
     * Performs symbolic backpropagation and returns all partial derivatives
     * of this node with respect to every node in the graph.
     *
     * @returns {Map<string|Node, Node>}
     *   A map from keys to derivative expressions:
     *     - Node keys represent d(this)/d(node)
     *     - String keys represent d(this)/d(variableName)
     */
    backpropergation() {
        const allnodes = this.topologicalsort().reverse();//this=root at start
        const derivs = new Map([[this, ConstNode.one]]);//d this/d...

        for (const node of allnodes) {
            const dnodedparents = node.edgederivs();
            const dthisdnode = derivs.get(node);
            //if(dthisdnode===undefined)continue;//deriv is 0 //removed because always false i think
            for (let i = 0; i < node.parents.length; i++) {
                //this loop does essentially
                //derivs[parent]+=dnodedparent*deriv[node]

                const parent = node.parents[i];
                const dnodedparent = dnodedparents[i];

                //this is here so all variables of same name have same derivs
                let parentkey = parent instanceof VarNode ? parent.varname : parent;


                const mul = new MulNode(dnodedparent, dthisdnode);
                if (derivs.has(parentkey)) {
                    derivs.set(parentkey, new AddNode(derivs.get(parentkey), mul));
                } else {
                    derivs.set(parentkey, mul);
                }
            }
        }

        for (const node of allnodes) {
            if (node instanceof VarNode) {
                derivs.set(node, derivs.get(node.varname));
            }
        }

        return derivs;

    }
    backpropergationwithdefault(){
        const dthisd_=this.backpropergation();
        return (x)=>dthisd_.get(x)??ConstNode.zero;
    }

    forwardpropergation(variable) {
        const allnodes = this.topologicalsort();//this=root at end

        const children = new Map();

        if (typeof variable === "string") {
            variable = allnodes.find(x => x instanceof VarNode && x.varname == variable);
        }
        const derivs = new Map([[variable, ConstNode.one]]);//d(...)/d(variable)

        for (const node of allnodes) {
            children.set(node, []);
            const edgederivs = node.edgederivs();
            for (let i = 0; i < node.parents.length; i++) {
                let parent = node.parents[i];
                if (parent instanceof VarNode && parent.varname == variable.varname)
                    parent = variable;
                children.get(parent).push([node, edgederivs[i]]);
            }
        }

        for (const node of allnodes) {
            //skip other variables
            if (node instanceof VarNode && node != variable) continue;
            if (!derivs.has(node)) continue;
            const nodederiv = derivs.get(node);
            for (const [child, edgederiv] of children.get(node)) {
                const mul = new MulNode(nodederiv, edgederiv);
                if (derivs.has(child)) {
                    derivs.set(child, new AddNode(derivs.get(child), mul));
                } else {
                    derivs.set(child, mul);
                }
                //derivs[child]+=   derivs[node]*edgederiv         
            }
        }
        return derivs;

    }
}

class ConstNode extends ExpressionNode {
    constructor(value) {
        super([]);
        this.value = value;
    }
    clonewithnewparents(newparents) {
        return new ConstNode(this.value);
    }
    compute(parentresults, variables) {
        return this.value;
    }
    edgederiv() {
        return [];
    }
    static one = new ConstNode(1);
    static minusone = new ConstNode(-1);
    static zero = new ConstNode(0);
}

class VarNode extends ExpressionNode {
    constructor(varname) {
        super([]);
        this.varname = varname;
    }
    clonewithnewparents(newparents) {
        return new VarNode(this.varname);
    }
    compute(parentresults, variables) {
        return variables.get(this.varname);
    }
    edgederiv() {
        return [];
    }
}

class AddNode extends ExpressionNode {
    constructor(...parents) {
        super(parents);
    }
    clonewithnewparents(newparents) {
        return new this.constructor(...newparents);
    }
    compute(parentresults, variables) {
        return parentresults.reduce((a, b) => a + b);
    }
    edgederiv() {
        return this.parents.map(x => ConstNode.one);
    }
}

class MulNode extends ExpressionNode {
    constructor(...parents) {
        super(parents);
    }
    clonewithnewparents(newparents) {
        return new this.constructor(...newparents);
    }
    compute(parentresults, variables) {
        return parentresults.reduce((a, b) => a * b);
    }
    edgederiv() {
        const result = new Array(this.parents.length);
        this.parents.reduceRight((rightacc, current, i) => {
            result[i] = rightacc;
            return mul(rightacc, current);
        }, ConstNode.one);
        this.parents.reduce((leftacc, current, i) => {
            result[i] = mul(leftacc, result[i]);
            return mul(leftacc, current);
        }, ConstNode.one);
        return result;
        //return this.parents.map(x=>ConstNode.one);
    }
}

class DivNode extends ExpressionNode {
    constructor(a, b) {
        super([a, b]);
    }
    clonewithnewparents(newparents) {
        return new this.constructor(...newparents);
    }
    compute(parentresults, variables) {
        return parentresults[0] / parentresults[1];
    }
    edgederiv() {
        const [numerator, denominator] = this.parents;
        const dfdnum = new DivNode(ConstNode.one, denominator);
        const dfddenom = (new NegNode(new DivNode(numerator, new MulNode(denominator, denominator))));
        return [dfdnum, dfddenom];
    }
}

class SubNode extends ExpressionNode {
    constructor(a, b) {
        super([a, b]);
    }
    clonewithnewparents(newparents) {
        return new this.constructor(...newparents);
    }
    compute(parentresults, variables) {
        return parentresults[0] - parentresults[1];
    }
    edgederiv() {
        return [ConstNode.one, ConstNode.minusone];
    }
}

class NegNode extends ExpressionNode {
    constructor(x) {
        super([x]);
    }
    clonewithnewparents(newparents) {
        return new this.constructor(...newparents);
    }
    compute(parentresults, variables) {
        return -parentresults[0];
    }
    edgederiv() {
        return [ConstNode.minusone];
    }
}


function simplify(node) {

    function normalization(node) {
        if (!(node instanceof ExpressionNode)) return node;
        if (node.parents.length > 0 && node.parents.every(x => x instanceof ConstNode))//constantantfolding
            return new ConstNode(node.eval());
        if (node instanceof NegNode)
            return new MulNode(ConstNode.minusone, node.parents[0]);
        if (node instanceof SubNode)
            return new AddNode(node.parents[0], new MulNode(ConstNode.minusone, node.parents[1]));
        if (node instanceof DivNode && node.parents[1] instanceof ConstNode)
            return new MulNode(node.parents[0], new ConstNode(1 / node.parents[1].value));
        if (node instanceof MulNode && node.parents.some(x => x instanceof ConstNode && x.value === 0))
            return ConstNode.zero;
        if (node.parents.length == 1 && (node instanceof MulNode || node instanceof AddNode))
            return node.parents[0];
        return node;
    }

    //noemalization constantantfolding cse
    let cse = new CommonSubexpressionElimination();
    node = node.visitnodesrec((node, parentreplacements) => {
        let nodereplacement = node.clonewithnewparents(parentreplacements);
        nodereplacement = normalization(nodereplacement);
        nodereplacement = cse.getreplacement(nodereplacement);
        return nodereplacement;
    });


    const childcounter = new Map();
    node.topologicalsort().forEach(node => {
        for (let parent of node.parents) {
            childcounter.set(parent, (childcounter.get(parent) ?? 0) + 1);
        }
    });
    //flatten
    node = node.visitnodesrec((node, parentreplacements) => {
        if (node instanceof MulNode || node instanceof AddNode) {
            //flatten parents
            let newparents = [];
            for (let p of node.parents) {
                if (p.constructor === node.constructor && childcounter.get(p) == 1) {
                    newparents.push(...p.parents);
                } else newparents.push(p);
            }

            //merge costants
            let constantfactors = newparents.filter(x => x instanceof ConstNode);
            newparents = newparents.filter(x => !(x instanceof ConstNode));

            if (constantfactors.length > 0) {
                /** @type {ConstNode} */
                let constantfactor;
                if (constantfactors.length > 1)
                    constantfactor = new ConstNode((new node.constructor(...constantfactors)).eval());
                else if (constantfactors.length == 1)
                    constantfactor = constantfactors[0];

                if (!(
                    (constantfactor.value == 1 && node instanceof MulNode) ||
                    (constantfactor.value == 0 && node instanceof AddNode)
                )) newparents.push(constantfactor);
            }

            if (newparents.length == 1) return newparents[0];

            return node.clonewithnewparents(newparents);

        }

        return node.clonewithnewparents(parentreplacements);
    });



    //undo some normalization
    node = node.visitnodesrec((node, parentreplacements) => {
        if (node instanceof MulNode && node.parents.some(x => x instanceof ConstNode && x.value == -1)) {//insert neg nodes instead of x*-1
            const constantfactors = node.parents.filter(x => x instanceof ConstNode);
            const newparents = node.parents.filter(x => !(x instanceof ConstNode));
            if (constantfactors.length != 1 || constantfactors[0].value != -1) throw new Error("Internal assert failed :(");
            if (newparents.length == 1)
                return new NegNode(newparents[0]);
            else
                return new NegNode(node.clonewithnewparents(newparents));
        }
        if (node instanceof AddNode && node.parents.some(x => x instanceof NegNode)) {//insert sub nodes
            const poss = node.parents.filter(x => !(x instanceof NegNode));
            const negs = node.parents.filter(x => x instanceof NegNode).map(x => x.parents[0]);
            const neg = (negs.length == 1) ? negs[0] : new AddNode(...negs);
            if (poss.length == 0) return new NegNode(neg);
            const pos = (poss.length == 1) ? poss[0] : new AddNode(...poss);
            return new SubNode(pos, neg);
        }
        return node.clonewithnewparents(parentreplacements);
    });

    node = new CommonSubexpressionElimination().getreplacement(node);//cse again
    return node;
}

class CommonSubexpressionElimination {
    constructor() {
        //cse
        this.idcounter = 0;
        this.nodeids = new Map();
        this.sigtonode = new Map();
        this.nodereplacement = new Map();
    }
    getreplacement(node) {
        return node.visitnodesrec((node, parentreplacements) => {
            const nodereplacement = node.clonewithnewparents(parentreplacements);
            if (!(node instanceof ExpressionNode)) return node;

            const sig = this.getsignature(nodereplacement);
            if (this.sigtonode.has(sig)) return this.sigtonode.get(sig);
            this.sigtonode.set(sig, nodereplacement);
            return nodereplacement;
        }, this.nodereplacement);
    }
    getsignature(node) {
        let sig = node.constructor.name + "(";
        if (node instanceof VarNode) {
            sig += node.varname;
        } else if (node instanceof ConstNode) {
            sig += node.value;
        } else {
            const parentids = node.parents.map(x => this.getid(x));
            if (node instanceof MulNode || node instanceof AddNode)
                parentids.sort((a, b) => a - b);//order doesnt mattr for these
            sig += parentids.join(",");
        }
        sig += ")";
        return sig;
    }
    getid(node) {
        let id = this.nodeids.get(node);
        if (id === undefined) {
            id = this.idcounter++;
            this.nodeids.set(node, id);
        }
        return id;
    }
}

class BundlenodeNode extends Node {
    constructor(...parents) {
        super(parents);
    }
    compute(parentresults) {
        return parentresults;
    }
    clonewithnewparents(newparents) {
        return new this.constructor(...newparents);
    }

}

class AssignementNode extends Node {
    constructor(variable, expression) {
        super([variable, expression]);
    }
    compute(parentresults) {
        return parentresults;
    }
    clonewithnewparents(newparents) {
        return new this.constructor(...newparents);
    }

}




class SubgraphNode extends Node {

    /**
     * 
     * @param {Node[]} inputglobals
     * @param {String[]} inputglobalsnames 
     * @param {BundlenodeNode} subgraphoutput 
     */
    constructor(inputglobals, inputglobalsnames, subgraphoutput) {
        super(inputglobals);
        this.inputglobalsnames = inputglobalsnames;
        this.subgraphoutput = subgraphoutput;
    }
    clonewithnewparents(newparents) {
        return new this.constructor(newparents, this.inputglobalsnames, this.subgraphoutput);
    }
    compute(parentresults, variables) {
        const internalvariables = new Map(variables);
        for (let [i, varname] of this.inputglobalsnames.entries()) {
            internalvariables.set(varname, parentresults[i]);
        }
        return this.subgraphoutput.eval(internalvariables);
    }



    static split(subgraphoutput) {
        const splitnodes = new Set();//these nodes are the gpu inputs which are precomputed on cpu
        subgraphoutput.visitnodesrec((node, parentresults) => {
            if (node instanceof VarNode) {
                if (["_V_X", "_V_Y", "_V_Z"].includes(node.varname)) return { dependsonxyz: true, dependsonvariables: false };
                else return { dependsonxyz: false, dependsonvariables: true };
            } else {
                const dependsonxyz = parentresults.some(item => item.dependsonxyz);//reduce((a,b)=> a||b.dependsonxyz,false);
                const dependsonvariables = parentresults.some(item => item.dependsonvariables);//.reduce((a,b)=> a||b.dependsonvariables,false);
                //using constantelimination all nodes should depend on vars or be const nodes (or be xyz)

                if (dependsonxyz && dependsonvariables) {
                    for (let i = 0; i < parentresults.length; i++) {
                        const parentres = parentresults[i];
                        if (parentres.dependsonvariables && !parentres.dependsonxyz) {
                            splitnodes.add(node.parents[i]);  //if node depends on xyz but parent doesnt
                        }
                    }
                }
                return { dependsonxyz, dependsonvariables };
            }
        });

        let variablecounter = 0;
        const varnames = [];
        const correspondingnode = [];
        const graphcopy = subgraphoutput.copyGraph((node, clone) => {
            if (splitnodes.has(node)) {
                const newvar = new VarNode(`args[${variablecounter++}]`);
                varnames.push(newvar.varname);
                correspondingnode.push(node);
                return newvar;
            }
        });
        return new SubgraphNode(correspondingnode, varnames, graphcopy);
    }

    evalsplit(variables = null, cache = new Map()) {
        return new Map(this.subgraphvarnames.map((varname, i) => {
            return [varname, this.parents[i].eval(variables, cache)];
        }))
    }




}

/**
 * //i was lazy and wrote this docstring using chatgpt
 * Splits a computational graph into a subgraph and external input variables.
 * 
 * This function identifies nodes in the graph that are **dependencies of a subgraph**
 * but are not part of it (e.g., CPU-precomputed inputs for GPU). These nodes are
 * replaced with variable nodes in the copied subgraph, and a mapping from the original
 * node to the variable name is returned.
 * 
 * @param {Node} root The root node of the computational graph to analyze.
 * @param {(Node|string)[]} subgraphdependencies Nodes or variable names that the subgraph depends on.
 * @returns {Object} An object containing:
 *   - {Map<Node, string>} nodetosubgraphname: maps split nodes to variable names in the subgraph.
 *   - {Node} subgraph: a copied subgraph where split nodes are replaced with VarNodes.
 */
function splitgraph(root, subgraphdependencies) {

    subgraphdependencies = new Set(subgraphdependencies);
    for (const node of [...subgraphdependencies]) {
        if (node instanceof VarNode) { subgraphdependencies.add(node.varname) }
    }

    const splitnodes = new Set();//these nodes are the gpu inputs which are precomputed on cpu. on these te graph will be split
    root.visitnodesrec((node, parentresults) => {
        const isconstant = parentresults.every(item => item.isconstant) && (!(node instanceof VarNode));
        let isinsubgraph = parentresults.some(item => item.isinsubgraph);
        if (subgraphdependencies.has(node) || ((node instanceof VarNode) && subgraphdependencies.has(node.varname))) {
            isinsubgraph = true;
        }

        if (isinsubgraph && !isconstant) {
            for (let i = 0; i < parentresults.length; i++) {
                const parentres = parentresults[i];
                if (!parentres.isconstant && !parentres.isinsubgraph) {
                    splitnodes.add(node.parents[i]);  //if node depends on dependencies but parent doesnt
                }
            }
        }


        return { isconstant, isinsubgraph };
    });

    let variablecounter = 0;
    const nodetosubgraphname = new Map();
    const subgraph = root.copyGraphLazy((node) => {
        if (splitnodes.has(node)) {
            const varname = `args[${variablecounter++}]`;
            nodetosubgraphname.set(node, varname);
            return new VarNode(varname);
        }
    });

    return { nodetosubgraphname, subgraph };
}


class custumCodeNode extends Node{
    constructor(parents,codtemplate) {
        super(parents);
        this.codtemplate=codtemplate;
    }
    clonewithnewparents(newparents) {
        return new this.constructor(newparents,this.codtemplate);
    }

    gencode(parentscode){
        return codtemplate(...parentscode);
    }
}


export class visualizationtargetnode extends Node {
    constructor(nodes, name, color) {
        super(nodes);
        this.color = color;
        this.nodes = nodes,
            this.name = name;
    }

    clonewithnewparents(newparents) {
        return new this.constructor(newparents, this.name, this.color);
    }

    generatecode() {
        function summofsquares(nodes) {
            const squares=nodes.map(n => new MulNode(n, n));
            if(nodes.length==1)return squares[0];
            return new AddNode(...squares);
        }

        function replacexyz(root, x, y, z) {
            return root.copyGraph((original) => {
                if (original instanceof VarNode) {
                    if (original.varname == "_V_X") { return x; }
                    if (original.varname == "_V_Y") { return y; }
                    if (original.varname == "_V_Z") { return z; }
                }
            });
        }

        function returnvec4node(x,y,z,w){
            return new custumCodeNode(
                [x,y,z,w],
                (x,y,z,w)=>`return vec4(${x},${y},${z},${w});`
            );
        }

        function generateFunctionCode( header,body) {
            const optomized = simplify(body);
            const functionbody = codegenglsl(optomized);
            const code = header.replace("?", "\n" + functionbody + "\n");
            return code;
        }

        const { nodetosubgraphname, subgraphxyz } = splitgraph(new BundlenodeNode(this.parents), ["_V_X", "_V_Y", "_V_Z"]);
        
        const a = new VarNode("a");
        const x = new AddNode(new VarNode("rayOrigin.x"), new MulNode(a, new VarNode("rayDir.x")));
        const y = new AddNode(new VarNode("rayOrigin.y"), new MulNode(a, new VarNode("rayDir.y")));
        const z = new AddNode(new VarNode("rayOrigin.z"), new MulNode(a, new VarNode("rayDir.z")));
        
        function rayify(f){
           return replacexyz(subgraphxyz,x,y,z);
        }

        
        const replacements=new Map();
        

        {
            const subgraphxyzsus = summofsquares(subgraphxyz.parents);
            //xyzDual xyzDualSummofsquares(vec3 pos) {?}//deriv xyz sus     
            const dfd_=subgraphxyzsus.backpropergationwithdefault();
            const body=returnvec4node(dfd_("_V_X"),dfd_("_V_Y"),dfd_("_V_Z"),subgraphxyzsus);//:)
            const header="xyzDual xyzDualSummofsquares(vec3 pos) {?}";
            replacements.set(header,generateFunctionCode(header,body));
        }   
        
        {
            const subgraphray=rayify(subgraphxyz);
            //void DualF(vec3 rayDir, vec3 rayOrigin,float a,out Dual[numoutputs] result) {?}//deriv ray multi
            const d_da=subgraphray.forwardpropergation(a);
            const body=new BundlenodeNode(subgraphray.parents.map((resulti,i)=>
                new custumCodeNode(
                    [resulti,d_da.get(resulti)??ConstNode.zero],
                    (strresulti,strdresultida)=>`result[${i}]=vec2(${strresulti},${strdresultida});`
                )
            ));//:)
            const header="void DualF(vec3 rayDir, vec3 rayOrigin,float a,out Dual[numoutputs] result) {?}";
            replacements.set(header,generateFunctionCode(header,body));
        }


        const subgraphraysus=rayify(subgraphxyzsus);
        {
            //float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a){?}//ray sus 
            const body=new custumCodeNode([subgraphraysus],(f)=>`return ${f};`);//:)
            functions.set("float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a){?}",body);
            const header="float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a){?}";
            replacements.set(header,generateFunctionCode(header,body));
        }

        {
            //DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){?}//deriv Complex ray sus
            //i need dfda and then complexify it
            const [complexf,complexdfda]=replacetyped(
                new Map([a,new Complex(new VarNode("a.x"),new VarNode("a.y"))]),//replace a => Complex(a.x,a.y)
                [subgraphraysus,subgraphraysus.backpropergationwithdefault()(a)]//returns complex or nodes of [f(a),f'(a)]
            ).map(corn=>Complex.promote(corn));
            const body=returnvec4node(complexf.real,complexf.imag,complexdfda.real,complexdfda.imag);//:)
            const header="DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){?}";
            replacements.set(header,generateFunctionCode(header,body));
        }



        {
            const header="DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){?}";
            if(subgraphxyz.parents.length==1){
                //DualComplex DualComplexSingular(vec3 rayDir, vec3 rayOrigin,Complex a){?}//deriv Complex ray singular
                const subgraphraysing=rayify(subgraphxyz.parents[0]);
                const [complexf,complexdfda]=replacetyped(
                    new Map([a,new Complex(new VarNode("a.x"),new VarNode("a.y"))]),//replace a => Complex(a.x,a.y)
                    [subgraphraysing,subgraphraysing.backpropergationwithdefault()(a)]//returns complex or nodes of [f(a),f'(a)]
                ).map(corn=>Complex.promote(corn));
                const body=returnvec4node(complexf.real,complexf.imag,complexdfda.real,complexdfda.imag);//:)
                
                replacements.set(header,generateFunctionCode(header,body));
                replacements.set("#define SINGULAROUTPUT ?","#define SINGULAROUTPUT 1");
            }else{
                replacements.set(header,"");
                replacements.set("#define SINGULAROUTPUT ?","#define SINGULAROUTPUT 0");
            }
        }



/*        
uniform float[?] args;


#define POLYDEGREE ? //degree of polynomial (for the sum of squares)
#define USE_DOUBLEROOTS ? //if the poly is a sum of squares

#if USE_DOUBLEROOTS
    #define NUM_ROOTS (POLYDEGREE / 2)
#else
    #define NUM_ROOTS POLYDEGREE
#endif

const int numoutputs=?;
*/




        replacements.set(
            "uniform float[?] args;",
            subgraphxyz.parents.length==0?"":`uniform float[${subgraphxyz.parents.length}] args;`
        );


        
    }

}

class GLSLFunction {
    constructor(globals, jsfunbody, jsfunargnames, glslcode) {
        this.globals = globals;
        this.jsfun = jsfun;
        this.glslcode, glslcode;
    }
    eval(variables = null, cache = new Map(),) {

    }

}


function makeAssignementGraph(root, inlineConstants = true) {
    //Performs SSA (Static Single Assignement) for expression nodes
    // roots with more than one child need to be assignments
    // constants may be removed from this
    // n1 = 0.5
    // n2 = n1 * x
    // n3 = n1 * y
    // vs with constant inlining
    // n2 = 0.5 * x
    // n3 = 0.5 * y



    // count how many children each node has
    const numberOfChildren = root.countchildren();

    let variablecounter = 0;

    const expressions = [];

    root.copyGraph((originalnode, clone) => {
        if (originalnode instanceof VarNode) return;
        if (inlineConstants && originalnode instanceof ConstNode) return;
        if (!(originalnode instanceof ExpressionNode)) {
            expressions.push(clone);
            return;
        }
        if ((numberOfChildren.get(originalnode) ?? 0) <= 1) return;

        const variable = new VarNode(`_generatednode${variablecounter++}`);
        expressions.push(new AssignementNode(variable, clone));
        return variable;
    });

    return expressions;


    /*
        const nodeToVariable = new Map();
        function replaceWithVariables(node) {
          return node.copyGraph(currentNode => nodeToVariable.get(currentNode));
        }
    
        let variablecounter=0;
    
        const idkiamtired= nodes.map(node => {
          if(node.type==NodeTypes.UNTYPED)return replaceWithVariables(node);
          if (node instanceof VarNode) return;// Variable nodes don’t need to be assigned a new name
          if (inlineConstants && node instanceof ConstNode) return; // optionally skip consts
          if ((numberOfChildren.get(node) ?? 0) == 0) throw new Error("typed node without children. use a return or assignement node to get output");//or u could implement a custom untyped node for that     
          if ((numberOfChildren.get(node) ?? 0) <= 1) return;       // we only want to assign nodes which have 2 or more children
    
          const variable = new VarNode(`_generatednode${variablecounter++}`, node.type);
          
          // copy the graph, replacing other assigned nodes with their variables
          const expression = replaceWithVariables(node);
          
          nodeToVariable.set(node,variable);//this indecates all occurences of node will be replaced by variable
          return new AssignementNode(variable,expression);
          
        }).filter(x=>x!=undefined);
        idkiamtired.forEach(n=>n.promoteTypes());
        return idkiamtired;*/

}
function codegenglsl(root) {
    return makeAssignementGraph(root).map(node => {
        return node.visitnodesrec((node, parents) => {
            if (node instanceof VarNode) return node.varname;
            if (node instanceof MulNode) return "(" + parents.join("*") + ")";
            if (node instanceof AddNode) return "(" + parents.join("+") + ")";
            if (node instanceof SubNode) return `(${parents[0]}-${parents[1]})`;
            if (node instanceof DivNode) return `(${parents[0]}/${parents[1]})`;
            if (node instanceof NegNode) return `(-${parents[0]})`;
            if (node instanceof ConstNode) {
                const s = node.value.toString();
                if (s.includes('.') || s.includes('e') || s.includes('E')) return s;
                return s + ".0";
            }
            if (node instanceof AssignementNode)
                return ((parents[0] instanceof ConstNode) ? "" : "const ") + `float ${parents[0]}=${parents[1]};`;
            if (node instanceof custumCodeNode)
                return node.gencode(parents);
        });
    }).filter(line => typeof line == "string").join("\n");
}





class Complex{
    constructor(real,imag){
        this.real=real;this.imag=imag;
    }
    static promote(x) {//lazy chatgpt code
        // Already a Complex → return as-is
        if (x instanceof Complex) return x;

        // If x is a Node → treat as real part, imaginary = 0
        if (x instanceof Node) return new Complex(x, new ConstNode.zero);

        // If x is a raw number → wrap in ConstNode
        if (typeof x === "number") return new Complex(new ConstNode(x), new ConstNode.zero);

        // Optional: throw for unsupported types
        throw new Error(`Cannot promote value of type ${x.constructor.name} to Complex`);
    }

    
    static mul(...parents){
        return parents.reduce((acc,x)=>new Complex(
            new SubNode(new MulNode(acc.real,x.real),new MulNode(acc.imag,x.imag)),
            new AddNode(new MulNode(acc.real,x.imag),new MulNode(acc.imag,x.real))
        ));
    }
    static add(...parents){
        return new Complex(new AddNode(...parents.map(x=>x.real)),new AddNode(...parents.map(x=>x.imag)));
    }
    static sub(ca,cb){
        return new Complex(new SubNode(ca.real,cb.real),new SubNode(ca.imag,cb.imag));
    }
    static neg(x){return new Complex(new NegNode(x.real),new NegNode(x.imag));}
    static div(a, b) {
        const c2_plus_d2 = new AddNode(
            new MulNode(b.real, b.real),
            new MulNode(b.imag, b.imag)
        );

        const real_part = new DivNode(
            new AddNode(
                new MulNode(a.real, b.real),
                new MulNode(a.imag, b.imag)
            ),
            c2_plus_d2
        );

        const imag_part = new DivNode(
            new SubNode(
                new MulNode(a.imag, b.real),
                new MulNode(a.real, b.imag)
            ),
            c2_plus_d2
        );

        return new Complex(real_part, imag_part);
    }



}

function replacetyped(replacements,nodes){
    replacements=new Map(replacements);
    for(let [k,v] of [...replacements.entries()])if(k instanceof VarNode)replacements.set(k.varname,v);
    const cache=new Map();
    return nodes.map(root=>root.visitnodesrec((original,parentresults)=>{
        //replace
        if(replacements.has(original))return replacements.get(original);
        if((original instanceof VarNode)&&replacements.has(original.varname)){
            return replacements.get(original.varname);
        }
        //everything of type node
        if(parentresults.every(x=>x instanceof Node))return original.clonewithnewparents(parentresults);
        //different types
        const parenttypes=new Set(parentresults.filter(x=>!(x instanceof Node)).map(x=>x.constructor));
        if(parenttypes.size!=1)throw new Error("type mixing not implemented rn");
        const [parenttype]=parenttypes.values();
        const promoted=parentresults.map(p=>p.constructor===parenttype?p:parenttype.promote(p));
        
        if (original instanceof MulNode) return parenttype.mul(...promoted);
        if (original instanceof AddNode) return parenttype.add(...promoted);
        if (original instanceof SubNode) return parenttype.sub(...promoted);
        if (original instanceof DivNode) return parenttype.div(...promoted);
        if (original instanceof NegNode) return parenttype.neg(...promoted);
        throw new Error("unknown nodetype for replacetyped")
    },cache));
}