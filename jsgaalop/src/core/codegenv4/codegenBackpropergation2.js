class Color {
    constructor(r = 0, g = 0, b = 0 ,a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    toString() {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }
}


export class GaalopGraph {
    constructor() {
        this.name = undefined;
        this.inputScalars = new Map(); // variablename->variable
        this.outputMultivectors = new Map(); // name -> Multivector of nodes
        this.allMultivectors=undefined;
        this.objectcolormap = new Map(); //name (of output node) -> color

        /** 
         * maps the name of the innerProductResult to the output Multivector Name
         * for example 
         * _V_PRODUCT0 => S1
         * _V_PRODUCT1 => S2
         * _V_PRODUCT2 => S3
         * @type {Map<string,string>} 
         * 
        */
        this.renderingExpression = new Map(); //name (of inner product result) -> expression (name of multivector)
    }



    static fromjson(jsonstring){
        const graph=new GaalopGraph();
        const json=JSON.parse(jsonstring);
        graph.name=json.name;
    
        const Multivectors=new Map(); // name -> Multivector of nodes
        const scalars=new Map(); // name -> node
    
        for(const [index, inputScalar] of json.inputScalars.entries()){
            let node;
            if(new Set(["_V_X", "_V_Y", "_V_Z"]).has(inputScalar))node=new VarNode(inputScalar);
            else node=new VarNode(inputScalar);
            
            graph.inputScalars.set(inputScalar, node);
            scalars.set(inputScalar, node);
            scalars.set("inputsVector["+index+"]", node);//gapp behaves weirdly and uses inputsVector[index] instead of name
        }
    
        for (const renderingExpression of json.renderingExpressions) {
            const name = renderingExpression.name;
            const expression = renderingExpression.expression;
            graph.renderingExpression.set(name, expression);
        }
        //const inputsVector = json.inputScalars;
    
    
        function parseExpression(node) {
            switch(node.type){
                case "Mul":return new MulNode(parseExpression(node.left), parseExpression(node.right));
                case "Add":return new AddNode(parseExpression(node.left), parseExpression(node.right));
                case "Sub":return new SubNode(parseExpression(node.left), parseExpression(node.right));
                case "Div":return new DivNode(parseExpression(node.left), parseExpression(node.right));
                case "Const":return new ConstNode(node.value);
                case "Negation":return new NegNode(parseExpression(node.operand));
                case "MathFunctionCall":
                    const func = node.function;
                    const operand = parseExpression(node.operand);
                    if (func === "abs") {
                        //return new GraphNode(AbsOperand.instance,[operand]);
                        return new AbsNode(operand);
                        //throw new Error(`i havent implementedthis node yet`);
                    } else if (func === "sqrt") {
                        //return new GraphNode(SqrtOperand.instance,[operand]);
                        //throw new Error(`i havent implementedthis node yet`);
                        return new SqrtNode(operand);
                    } else {
                        throw new Error(`Unknown function: ${func}`);
                    }
                case "Pow":
                    const exponent=parseExpression(node.right).eval();
                    const left=parseExpression(node.left);
                    return new MulNode(...Array(exponent).fill(left)); 

                case "MultivectorVariable":
                    //TODO bladindex should be integer. how do i cast it to int?
                    if (node.name.startsWith("inputsVector[") && node.name.endsWith("]")) {
                    return scalars.get(node.name);// Return the corresponding input vector
                    }
        
                    return Multivectors.get(node.name).get(node.bladeIndex);
                case "Variable":
                    return scalars.get(node.name);
                default:
                    console.log(node);
                    throw new Error(`Unknown node type: ${node.type}`);
            }
        }
    
        var activeColor=new Color(0,0,0,1);
        for (const node of json.nodes){
            if(node.type==="AssignmentNode"){
                const expression=parseExpression(node.expression);
                const variablejson=node.variable;
                if(variablejson.type==="Variable"){
                    scalars.set(variablejson.name,expression);
                } else if(variablejson.type==="MultivectorVariable"){
                    const name=variablejson.name;
                    const bladeIndex=variablejson.bladeIndex;
                    if(!Multivectors.has(name)){
                        Multivectors.set(name,new Map());
                    }
                    //TODO handle reasigning of multivector variables
                    Multivectors.get(name).set(bladeIndex,expression);
                } else{
                    throw new Error(`Unknown variable type: ${variablejson.type}`);
                }
            } else if(node.type==="ColorNode"){
                activeColor=new Color(node.r,node.g,node.b,node.alpha);
            } else if (node.type==="StoreResultNode"){
    
            } else if(node.type==="ExpressionStatement"){
                if(node.expression.type!=="Variable"){
                    throw new Error("ExpressionStatement must be a variable");
                }
                graph.objectcolormap.set(node.expression.name,activeColor);
            } else {
                throw new Error(`Unknown node type: ${node.type}`);
            }
            
        }
    
        for (const name of json.outputMultivectors) {
            graph.outputMultivectors.set(name, Multivectors.get(name));
        }

        graph.allMultivectors=Multivectors;
        
        return graph;
    }

    
    /**
     * 
     * @returns {VisualisationGraph[]} list of visualisation graphs
     */
    

    vistargets(){
        const VisualisationGraphs=[];
        for (const [innerProductResultName,outputMultivectorName] of this.renderingExpression.entries()) {
            const innerProductResultNodes=[...this.outputMultivectors.get(innerProductResultName).values()];
            const color=this.objectcolormap.get(outputMultivectorName);
            //VisualisationGraphs.push(new VisualisationGraph2(innerProductResultNodes,outputMultivectorName));
            VisualisationGraphs.push(new visualizationtargetnode(innerProductResultNodes,outputMultivectorName,color))
        }
        return VisualisationGraphs;
    }

    /*getoptimizedvistargets(){
        return new Bundlenode(this.vistargets()).constantfolding().commonsubexpressionelimination().parents;
    }*/


    
}





class Node {
    /**
     * 
     * @param {Node[]} parents 
     */
    constructor(parents) {
        /** @type {Node[]} */
        this.parents = parents;
        if(! (parents instanceof Array))throw new Error("parents isnt aa Array");
        for(const p of parents)if(! (p instanceof Node)||p==undefined)throw new Error("parent isnt a node");
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
            return this.clonewithnewparents(clonedParents);
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
    

    forwardpropergation(variable) {
        const allnodes = this.topologicalsort().filter(x=>x instanceof ExpressionNode);//this=root at end

        const children = new Map();

        if (typeof variable === "string") {
            variable = allnodes.find(x => x instanceof VarNode && x.varname == variable);
        }
        const derivs = new Map([[variable, ConstNode.one]]);//d(...)/d(variable)

        for (const node of allnodes) {
            children.set(node, []);
            const edgederivs = node.edgederiv();
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
            const dnodedparents = node.edgederiv();
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
    codegenGLSL(parentResults) {
        function flotify(x) {
      const s = x.toString();
      if (s.includes('.') || s.includes('e') || s.includes('E')) return s;
      return s + ".0";
    }
        return {code:flotify(this.value),type:NodeTypes.SCALAR};
    }
    static one = new ConstNode(1);
    static minusone = new ConstNode(-1);
    static zero = new ConstNode(0);
}

class VarNode extends ExpressionNode {
    constructor(varname,type=NodeTypes.SCALAR) {
        super([]);
        this.varname = varname;
        this.type=type;
    }
    clonewithnewparents(newparents) {
        return new VarNode(this.varname,this.type);
    }
    compute(parentresults, variables) {
        return variables.get(this.varname);
    }
    edgederiv() {
        return [];
    }
    codegenGLSL(parentResults) {
        return {code:this.varname,type:this.type};
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
    codegenGLSL(parentResults) {
        // parentResults: [{ code, type }, ...]
        if(parentResults.every(x=>x.type==NodeTypes.SCALAR))return  { code: "(" + parentResults.map(x=>x.code).join("+") + ")", type: NodeTypes.SCALAR };
        return parentResults.reduce((acc,x)=>{
            const type=unifyTypesBinary(acc.type,x.type);
            let code;
            if(type==NodeTypes.SCALAR)code=`(${acc.code}+${x.code})`;
            else if(type==NodeTypes.COMPLEX)code=`ComplexAdd(${acc.code},${x.code})`;
            else if(type==NodeTypes.INTERVALL)code=`(${acc.code}+${x.code})`;
            else throw Error("unknown mul codegen case");
            return {type,code};
        });
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
        function mul(a,b){
            if(a==ConstNode.one)return b;
            if(b==ConstNode.one)return a;
            return new MulNode(a,b);
        }
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
    }
    codegenGLSL(parentResults) {
        // parentResults: [{ code, type }, ...]
        if(parentResults.every(x=>x.type==NodeTypes.SCALAR))return  { code: "(" + parentResults.map(x=>x.code).join("*") + ")", type: NodeTypes.SCALAR };
        return parentResults.reduce((acc,x)=>{
            const type=unifyTypesBinary(acc.type,x.type);
            let code;
            if(type==NodeTypes.SCALAR)code=`(${acc.code}*${x.code})`;
            else if(type==NodeTypes.COMPLEX&&acc.code==x.code)code=`ComplexSquare(${acc.code})`;
            else if(type==NodeTypes.COMPLEX)code=`ComplexMul(${acc.code},${x.code})`;
            else if(type==NodeTypes.INTERVALL&&acc.code==x.code)code=`IntervallSquare(${acc.code})`;
            else if(type==NodeTypes.INTERVALL)code=`IntervallMul(${acc.code},${x.code})`;
            else throw Error("unknown mul codegen case");
            return {type,code};
        });
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
    codegenGLSL(parentResults) {
        // parentResults: [{ code, type }, { code, type }]
        // a/b
        const [a,b]=parentResults;
        if(a.type==NodeTypes.SCALAR && b.type==NodeTypes.SCALAR)
            return {type:NodeTypes.SCALAR,code:`(${a.code}/${b.code})`};

        throw Error("unknown div codegen case");// i didnt implement this because div should be removed in optimization
    }
}

class MaxNode extends ExpressionNode {
    constructor(a, b) {
        super([a, b]);
    }
    clonewithnewparents(newparents) {
        return new this.constructor(...newparents);
    }
    compute(parentresults, variables) {
        return Math.max(parentresults);
    }
    codegenGLSL(parentResults) {
        const [a,b]=parentResults;
        if(a.type==NodeTypes.SCALAR && b.type==NodeTypes.SCALAR)
            return {type:NodeTypes.SCALAR,code:`max(${a.code},${b.code})`};

        throw Error("unknown max codegen case");
    }
}
class MinNode extends ExpressionNode {
    constructor(a, b) {
        super([a, b]);
    }
    clonewithnewparents(newparents) {
        return new this.constructor(...newparents);
    }
    compute(parentresults, variables) {
        return Math.min(parentresults);
    }
    codegenGLSL(parentResults) {
        const [a,b]=parentResults;
        if(a.type==NodeTypes.SCALAR && b.type==NodeTypes.SCALAR)
            return {type:NodeTypes.SCALAR,code:`min(${a.code},${b.code})`};

        throw Error("unknown min codegen case");
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
    codegenGLSL(parentResults) {
        // parentResults: [{ code, type }, { code, type }]
        // a-b
        const [a,b]=parentResults;
        const type=unifyTypesBinary(a.type,b.type);
        let code;
        if(type==NodeTypes.SCALAR)code=`(${a.code}-${b.code})`;
        else if(type==NodeTypes.COMPLEX)code=`ComplexSub(${a.code},${b.code})`;
        else if(type==NodeTypes.INTERVALL)code=`IntervallSub(${a.code},${b.code})`;
        else throw Error("unknown sub codegen case");
        return {type,code};
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
    codegenGLSL(parentResults) {
        // parentResults: [{ code, type }]
        // -a
        const [a]=parentResults;
        let code;
        if(a.type==NodeTypes.SCALAR||a.type==NodeTypes.COMPLEX)code=`(-${a.code})`;
        else if(a.type==NodeTypes.INTERVALL)code=`IntervallNeg(${a.code})`;
        else throw Error("unknown sub codegen case");
        return {type:a.type,code};
    }
}

class CastNode extends ExpressionNode {
    constructor(parent,type) {
        super([parent]);
        this.type=type;
    }
    clonewithnewparents(newparents) {
        if(newparents.length!=1)throw new Error("assert failed, wrong parents legth");
        return new this.constructor(newparents[0],this.type);
    }
    codegenGLSL(parentResults) {
        // parentResults: [{ code, type }]
        // -a
        const [a]=parentResults;
        if(a.type==this.type)return a;
        if(a.type==NodeTypes.SCALAR){
            if(this.type==NodeTypes.COMPLEX)return{type:this.type,code:`Complex(${a.code},0.0)`};
            if(this.type==NodeTypes.INTERVALL)return{type:this.type,code:`Intervall${a.code})`};
        }
        throw Error("unknown sub codegen case");
    }
}

class SqrtNode extends ExpressionNode {
    constructor(x) {
        super([x]);
    }
    clonewithnewparents(newparents) {
        return new this.constructor(...newparents);
    }
    compute(parentresults, variables) {
        return Math.sqrt(parentresults[0]);
    }
}
class AbsNode extends ExpressionNode {
    constructor(x) {
        super([x]);
    }
    clonewithnewparents(newparents) {
        return new this.constructor(...newparents);
    }
    compute(parentresults, variables) {
        return Math.abs(parentresults[0]);
    }
    codegenGLSL(parentResults) {
        // parentResults: [{ code, type }]
        const [a]=parentResults;
        if(a.type==NodeTypes.SCALAR){return{type:NodeTypes.SCALAR,code:`abs(${a.code})`};}
        throw Error("unknown sub codegen case");
    }
}

function simplify(root) {
    //console.log("unoptimized",codegenGLSLTyped(node));

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
    root = root.visitnodesrec((node, parentreplacements) => {
        let nodereplacement = node.clonewithnewparents(parentreplacements);
        nodereplacement = normalization(nodereplacement);
        nodereplacement = cse.getreplacement(nodereplacement);
        return nodereplacement;
    });

    //let optimized=codegenGLSLTyped(root);
    const childcounter = new Map();
    root.topologicalsort().forEach(node => {
        for (let parent of node.parents) {
            childcounter.set(parent, (childcounter.get(parent) ?? 0) + 1);
        }
    });
    //flatten
    root = root.visitnodesrec((node, parentreplacements) => {
        if (node instanceof MulNode || node instanceof AddNode) {
            //flatten parents
            let newparents = [];
            for (let p of parentreplacements) {
                if (p.constructor === node.constructor && childcounter.get(p) == 1) {
                    newparents.push(...p.parents);
                } else newparents.push(p);
            }

            //merge costants
            let constantfactors = newparents.filter(x => x instanceof ConstNode);
            //console.log(constantfactors.map(x=>x.value));
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
                //else console.log("discard");
            }
            //console.log(newparents.filter(x => x instanceof ConstNode).length);

            if (newparents.length == 1) return newparents[0];

            return node.clonewithnewparents(newparents);

        }

        return node.clonewithnewparents(parentreplacements);
        
    });



    //undo some normalization
    root = root.visitnodesrec((node, parentreplacements) => {
        if (node instanceof MulNode && parentreplacements.some(x => x instanceof ConstNode && x.value == -1)) {//insert neg nodes instead of x*-1
            const constantfactors = parentreplacements.filter(x => x instanceof ConstNode);
            const newparents = parentreplacements.filter(x => !(x instanceof ConstNode));
            if (constantfactors.length != 1 || constantfactors[0].value != -1) throw new Error("Internal assert failed :(");
            if (newparents.length == 1)
                return new NegNode(newparents[0]);
            else
                return new NegNode(node.clonewithnewparents(newparents));
        }
        if (node instanceof AddNode && parentreplacements.some(x => x instanceof NegNode)) {//insert sub nodes
            const poss = parentreplacements.filter(x => !(x instanceof NegNode));
            const negs = parentreplacements.filter(x => x instanceof NegNode).map(x => x.parents[0]);
            const neg = (negs.length == 1) ? negs[0] : new AddNode(...negs);
            if (poss.length == 0) return new NegNode(neg);
            const pos = (poss.length == 1) ? poss[0] : new AddNode(...poss);
            return new SubNode(pos, neg);
        }
        return node.clonewithnewparents(parentreplacements);
    });

    root = new CommonSubexpressionElimination().getreplacement(root);//cse again
    /*console.log(root.topologicalsort().filter(x=>x instanceof ConstNode).map(x=>[x.value,x.value==1,x.value==-1]));

    root.topologicalsort().filter(x=>x instanceof ConstNode).forEach(c=>root.topologicalsort().forEach(n=>{
        if(n.parents.some(x=>x==c))console.log(n);
    }
    ));*/


    //if(optimized!=codegenGLSLTyped(root))console.log("before",optimized,"optimized",codegenGLSLTyped(root));
    return root;
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
    constructor(parents) {
        super(parents);
    }
    compute(parentresults) {
        return parentresults;
    }
    clonewithnewparents(newparents) {
        return new this.constructor(newparents);
    }
    codegenGLSL(parentResults){
        return {code:undefined,type:NodeTypes.STATEMENT};
    }

}

//deprecated
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


class custumStatementNode extends Node{
    constructor(parents,codtemplate) {
        super(parents);
        this.codtemplate=codtemplate;
    }
    clonewithnewparents(newparents) {
        return new this.constructor(newparents,this.codtemplate);
    }

    gencode(parentscode){//deprecATED
        return codtemplate(...parentscode);
    }

    codegenGLSL(parentResults) {
        // parentResults: [{ code, type }, ...]
        return {type:NodeTypes.STATEMENT,code:this.codtemplate(...parentResults.map(x=>x.code))};
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
            return new custumStatementNode(
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
                new custumStatementNode(
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
            const body=new custumStatementNode([subgraphraysus],(f)=>`return ${f};`);//:)
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


    generatecode2() {
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
            return new custumStatementNode(
                [x,y,z,w],
                (x,y,z,w)=>`return vec4(${x},${y},${z},${w});`
            );
        }

        function generateFunctionCode( header,body) {
            const optomized = simplify(body);
            const functionbody = codegenGLSLTyped(optomized);
            const code = header.replace("?", "\n" + functionbody + "\n");
            return code;
        }

        const { nodetosubgraphname, subgraph:subgraphxyz } = splitgraph(new BundlenodeNode(this.parents), ["_V_X", "_V_Y", "_V_Z"]);
        
        
        function rayify(subgraphxyz,type=NodeTypes.SCALAR){
            const a = new VarNode("a",type);
            const x = new AddNode(new VarNode("rayOrigin.x"), new MulNode(a, new VarNode("rayDir.x")));
            const y = new AddNode(new VarNode("rayOrigin.y"), new MulNode(a, new VarNode("rayDir.y")));
            const z = new AddNode(new VarNode("rayOrigin.z"), new MulNode(a, new VarNode("rayDir.z")));
           return replacexyz(subgraphxyz,x,y,z);
        }

        //function setInputtype()

        
        const replacements=new Map();
        

        const subgraphxyzsus = summofsquares(subgraphxyz.parents);
        {
            //xyzDual xyzDualSummofsquares(vec3 pos) {?}//deriv xyz sus     
            const dfd_=subgraphxyzsus.backpropergationwithdefault();
            const body=replacexyz(
                returnvec4node(dfd_("_V_X"),dfd_("_V_Y"),dfd_("_V_Z"),subgraphxyzsus),
                new VarNode("pos.x"),new VarNode("pos.y"),new VarNode("pos.z")
            );//:)
            const header="xyzDual xyzDualSummofsquares(vec3 pos) {?}";
            replacements.set(header,generateFunctionCode(header,body));
        }   
        
        {
            const subgraphray=rayify(subgraphxyz);
            //void DualF(vec3 rayDir, vec3 rayOrigin,float a,out Dual[numoutputs] result) {?}//deriv ray multi
            const d_da=subgraphray.forwardpropergation("a");
            const body=new BundlenodeNode(subgraphray.parents.map((resulti,i)=>
                new custumStatementNode(
                    [resulti,d_da.get(resulti)??ConstNode.zero],
                    (strresulti,strdresultida)=>`result[${i}]=vec2(${strresulti},${strdresultida});`
                )
            ));//:)
            const header="void DualF(vec3 rayDir, vec3 rayOrigin,float a,out Dual[numoutputs] result) {?}";
            replacements.set(header,generateFunctionCode(header,body));

            replacements.set("numoutputs=?",`numoutputs=${body.parents.length}`);
        }


        
        {
            const subgraphraysus=rayify(subgraphxyzsus);
            //float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a){?}//ray sus 
            const body=new custumStatementNode([subgraphraysus],(f)=>`return ${f};`);//:)
            //functions.set("float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a){?}",body);
            const header="float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a){?}";
            replacements.set(header,generateFunctionCode(header,body));
        }

        {
            const subgraphraysus=rayify(subgraphxyzsus,NodeTypes.COMPLEX);
            //DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){?}//deriv Complex ray sus
            //i need dfda and then complexify it
            
            const body= new custumStatementNode(
                [
                    new CastNode(subgraphraysus,NodeTypes.COMPLEX),
                    new CastNode(subgraphraysus.backpropergationwithdefault()("a"),NodeTypes.COMPLEX)
                ],
                (fa,fada)=>`return vec4(${fa},${fada});`
            );//:)
            const header="DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){?}";
            replacements.set(header,generateFunctionCode(header,body));
        }

        
        {
            const subgraphraysus=rayify(subgraphxyzsus,NodeTypes.COMPLEX);
            //Intervall IntervallSummofsquares(Intervall _V_X,Intervall _V_Y,Intervall _V_Z) {?}

            const replaced = replacexyz(
                subgraphxyzsus,
                new VarNode("_V_X", NodeTypes.INTERVALL),
                new VarNode("_V_Y", NodeTypes.INTERVALL),
                new VarNode("_V_Z", NodeTypes.INTERVALL)
            );
            const casted = new CastNode(replaced, NodeTypes.INTERVALL);
            const body = new custumStatementNode([casted],r => `return ${r};`);

            const header="Intervall IntervallSummofsquares(Intervall _V_X,Intervall _V_Y,Intervall _V_Z) {?}";
            replacements.set(header,generateFunctionCode(header,body));
        }


        {
            const transformed=[...inter3d.transformgraph(subgraphxyz).parents];
            transformed.unshift(new custumStatementNode([],()=>
                `    float _V_X=(x.x+x.y)/2.;\n`+//Voxel mitte
                `    float _V_Y=(y.x+y.y)/2.;\n`+
                `    float _V_Z=(z.x+z.y)/2.;\n`+
                `    float delta=(x.y-x.x)/2.;\n`)
            )
            const body=new BundlenodeNode(transformed);
            const header="bool evaluatevoxelIntervall3d(Intervall x, Intervall y, Intervall z) {?}";
            replacements.set(header,generateFunctionCode(header,body));
        }


        {
            
            if(subgraphxyz.parents.length==1){
                const subgraphraysus=rayify(subgraphxyz.parents[0],NodeTypes.COMPLEX);
                //DualComplex DualComplexSingular(vec3 rayDir, vec3 rayOrigin,Complex a){?}
                //i need dfda and then complexify it

                const body= new custumStatementNode(
                    [
                        new CastNode(subgraphraysus,NodeTypes.COMPLEX),
                        new CastNode(subgraphraysus.backpropergationwithdefault()("a"),NodeTypes.COMPLEX)
                    ],
                    (fa,fada)=>`return vec4(${fa},${fada});`
                );//:)

                const header="DualComplex DualComplexSingular(vec3 rayDir, vec3 rayOrigin,Complex a){?}";
                replacements.set(header,generateFunctionCode(header,body));
                replacements.set("#define SINGULAROUTPUT ?","#define SINGULAROUTPUT 1");
            }else{
                //replacements.set(header,"");
                replacements.set("#define SINGULAROUTPUT ?","#define SINGULAROUTPUT 0");
            }
        }




        const POLYDEGREE=subgraphxyzsus.visitnodesrec(
            (node,parentresults)=>{
            if(node instanceof VarNode){
                if(["_V_X","_V_Y","_V_Z"].includes(node.name))return 1;
                else return 0;
            }else if(node instanceof AddNode||node instanceof SubNode||node instanceof NegNode){
                return  Math.max(...parentresults);
               
            }else if(node instanceof MulNode){
                return parentresults.reduce((a,b)=>a+b);
            }else if(node instanceof ConstNode){
                return 0;
            }else if(node instanceof DivNode){
                if(parentresults[1]!=0)throw new Error("polynomial deree only for constant divisor in DivNode");
                else return parentresults[0];
            }
            throw new Error("unknown nodetype for polydegree calc");
            }
        );
        replacements.set("#define POLYDEGREE ?",`#define POLYDEGREE ${POLYDEGREE}`);
        replacements.set("#define USE_DOUBLEROOTS ?",`#define USE_DOUBLEROOTS ${+(subgraphxyz.parents.length!=1)}`);

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
            nodetosubgraphname.size==0?"":`uniform float[${nodetosubgraphname.size}] args;`
        );

        return replacements;


        
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
    const cache=new Map();

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
    },cache);

    return [expressions,cache];

}

const NodeTypes=Object.freeze({
    STATEMENT:"Statement",
    INTERVALL:"Intervall",
    COMPLEX:"Complex",
    SCALAR:"Scalar"
});

function unifyTypesBinary(a, b) {
    if (a === NodeTypes.SCALAR && b === NodeTypes.SCALAR)
        return NodeTypes.SCALAR;

    if (
        (a === NodeTypes.SCALAR && b === NodeTypes.COMPLEX) ||
        (a === NodeTypes.COMPLEX && b === NodeTypes.SCALAR) ||
        (a === NodeTypes.COMPLEX && b === NodeTypes.COMPLEX)
    )
        return NodeTypes.COMPLEX;

    if (
        (a === NodeTypes.SCALAR && b === NodeTypes.INTERVALL) ||
        (a === NodeTypes.INTERVALL && b === NodeTypes.SCALAR) ||
        (a === NodeTypes.INTERVALL && b === NodeTypes.INTERVALL)
    )
        return NodeTypes.INTERVALL;

    throw new Error(`Illegal OP: ${a} AND ${b}`);
}

function codegenGLSLTyped(root, inlineConstants = true) {
    // Single-pass:
    // - SSA lowering
    // - type propagation
    // - code emission
    //
    // Expression nodes may inline if:
    //  - VarNode
    //  - ConstNode (if inlineConstants)
    //  - used only once
    //
    // Non-expression nodes (EmitNode, CustomCodeNode, etc.)
    // force emission.

    function glslTypeFromType(x){
        return {
            [NodeTypes.INTERVALL]:"Intervall",
            [NodeTypes.COMPLEX]:"Complex",
            [NodeTypes.SCALAR]:"float",
        }[x];
    }

    const numberOfChildren = root.countchildren();
    let variableCounter = 0;
    const lines = [];

    // visitnodesrec must:
    // - return { code, type }
    // - parents already processed
    root.visitnodesrec((node, parentResults) => {

        const { code, type } = node.codegenGLSL(parentResults);
        if((code && code.includes("Object"))||!type in NodeTypes)throw new Error("Bad codegen");

        if (type===NodeTypes.STATEMENT) {//syntesythe statements directly
            if(code) lines.push(code);
            return {code:null,type:NodeTypes.STATEMENT}; // emit nodes do not produce expressions
        }else{ 
            //just an assert
            for (const p of parentResults)
                if (p.type === NodeTypes.STATEMENT)
                    throw new Error("Statement used as expression input");
        }

        
        const canBeInlined =
            node instanceof VarNode ||
            (inlineConstants && node instanceof ConstNode) ||
            ((numberOfChildren.get(node) ?? 0) <= 1);

        if (canBeInlined) return { code, type };//part of expression

        //SSA MATERIALIZATION
        const varName = `_generatednode${variableCounter++}`;
        const glslType = glslTypeFromType(type);
        let assignement=`${glslType} ${varName} = ${code};`;
        if(node instanceof ConstNode)assignement="const "+assignement;
        lines.push(assignement);
        return { code: varName, type };
    });

    return lines.join("\n");
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
            if (node instanceof custumStatementNode)
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

class inter3d {
    //converted using chatgpt from python code and then rewridden again
    /**
     * coeffs: { keyString: GraphNode }
     * keyString is something like "1,0,0" representing exponents (ix^1 * iy^0 * iz^0)
     */
    constructor(coeffs = {}) {
        this.coeffs = coeffs;
    }

    static ix = new inter3d({ '1,0,0': ConstNode.one });
    static iy = new inter3d({ '0,1,0': ConstNode.one });
    static iz = new inter3d({ '0,0,1': ConstNode.one });
  
    /** 
     * Convert various types to inter3d:
     * - inter3d instance: return as is
     * - number 0: return empty polynomial
     * - other number: return constant polynomial with that number wrapped as GraphNode
     * @returns {inter3d}
     */
    static convert(x) {
        if (x instanceof inter3d) return x;
        if (typeof x === 'number') {
            if (x === 0) return new inter3d();
            return new inter3d({ '0,0,0': new ConstNode(x) });
        }
        if(x instanceof Node){
            return new inter3d({ '0,0,0': x });
        }
        throw new Error("Cannot convert to inter3d: " + x);
    }

    /**
     * Utility: parse key string "x,y,z" to array of integers
     * @returns {number[]}
     */
    static keyToArray(key) {
        return key.split(',').map(Number);
    }

    /**
     * Utility: add two keys element-wise: "1,0,0" + "0,2,1" -> "1,2,1"
     */
    static addKeys(a, b) {
        const arrA = inter3d.keyToArray(a);
        const arrB = inter3d.keyToArray(b);
        return arrA.map((v, i) => v + arrB[i]).join(',');
    }

    /*static subKeys(a, b) {
        const arrA = inter3d.keyToArray(a);
        const arrB = inter3d.keyToArray(b);
        return arrA.map((v, i) => v - arrB[i]).join(',');
    }*/
  
    /**
     * Add two inter3d polynomials symbolically.
     * The coefficients are GraphNodes and addition creates AddOperand nodes.
     */
    add(other) {
        other = inter3d.convert(other);
        const resultCoeffs = {};
    
        const keys = new Set([...Object.keys(this.coeffs), ...Object.keys(other.coeffs)]);
        for (const k of keys) {
            const a = this.coeffs[k];
            const b = other.coeffs[k];
            resultCoeffs[k] =(a !== undefined && b !== undefined) ? new AddNode(a, b) : a ?? b;
        }
        return new inter3d(resultCoeffs);
    }

    sub(other) {
        other = inter3d.convert(other);
        const resultCoeffs = {};
    
        const keys = new Set([...Object.keys(this.coeffs), ...Object.keys(other.coeffs)]);
        for (const k of keys) {
            const a = this.coeffs[k];
            const b = other.coeffs[k];
            if (a && b) {
                resultCoeffs[k] = new SubNode(a, b);
            } else if(a){
                resultCoeffs[k] = a;
            } else{//if b
                resultCoeffs[k] = new NegNode(b);
            }
        }
        return new inter3d(resultCoeffs);
    }
  
    /**
     * Multiply two inter3d polynomials symbolically.
     * Coefficients are GraphNodes, multiplication creates MulOperand nodes,
     * addition of same exponent terms creates AddOperand nodes.
     */
    mul(other) {
        other = inter3d.convert(other);
        const resultCoeffs = {};
    
        for (const [ka, va] of Object.entries(this.coeffs)) {
            for (const [kb, vb] of Object.entries(other.coeffs)) {
                const e = inter3d.addKeys(ka, kb);
                const mulNode = new MulNode(va, vb);
                const existing = resultCoeffs[e];
                if (existing) {
                    resultCoeffs[e] = new AddNode(existing, mulNode);
                } else {
                    resultCoeffs[e] = mulNode;
                }
            }
        }
        return new inter3d(resultCoeffs);
    }

    /**
     * 
     */
    div(other) {
        other = inter3d.convert(other);
    
        const keys = Object.keys(other.coeffs);
        if (keys.length !== 1) {
            throw new Error("Only monomial division is supported.");
        }
    
        const monomKey = keys[0];
        const divisorExponents = monomKey.split(",").map(Number);
        const divisorNode = other.coeffs[monomKey];
        if(divisorNode==undefined)throw new Error("divisorNode is undefined");
    
        const result = {};
    
        for (const [dividendKey,dividendValue] of Object.entries(this.coeffs)) {
            if(dividendValue==undefined)throw new Error("dividendValue is undefined");
            const dividendExponents = inter3d.keyToArray(dividendKey);
            const resultExponents = dividendExponents.map((dividendExponent,i)=>dividendExponent-divisorExponents[i]);
            const resultKey = resultExponents.join(",");
            result[resultKey] = new DivNode(dividendValue, divisorNode);
        }
    
        return new inter3d(result);
    }

    neg() {
        const result = {};
        for (const [key, value] of Object.entries(this.coeffs)) {
            result[key] = new NegNode(value);
        }
        return new inter3d(result);
    }
    
    static transformgraph(subgraphxyz) {

        const cache = new Map();
        const delta=inter3d.convert(new VarNode("delta"));
    
        const outputs=subgraphxyz.parents.map(x=>x.visitnodesrec((node, parentResults) => {
            if (node instanceof NegNode) return parentResults[0].neg();
            if (node instanceof MulNode) return parentResults.reduce((acc, cur) => acc.mul(cur));
            if (node instanceof AddNode) return parentResults.reduce((acc, cur) => acc.add(cur));
            if (node instanceof SubNode) return parentResults.reduce((acc, cur) => acc.sub(cur));
            if (node instanceof DivNode) return parentResults[0].div(parentResults[1]);
            if (node instanceof VarNode && node.varname.startsWith("_V_")) {
                switch (node.varname) {
                    case "_V_X": return inter3d.ix.mul(delta).add(node);//Ix*delta+x0
                    case "_V_Y": return inter3d.iy.mul(delta).add(node);//Iy*delta+y0
                    case "_V_Z": return inter3d.iz.mul(delta).add(node);//Iz*delta+z0
                    default: throw new Error("Unknown symbolic variable: " + node.varname);
                }
            }
            if (node.parents.length === 0) return inter3d.convert(node);
            throw new Error("Unhandled node type in transformgraph: " + node.constructor.name);
        },cache));


        const ReturnIfIntervallDoesntContainZero_Statements=[];
        for(const intervallpoly of outputs){
            let low=[];
            let high=[];

            for (const [k, coeff] of Object.entries(intervallpoly.coeffs)) {
                const exponents=inter3d.keyToArray(k);

                if(exponents.every(x=>x===0)){
                    low.push(coeff);
                    high.push(coeff);
                }else if(exponents.every(x=>x%2==0)){//even exponents are >=0
                    //if coeff <0 i want the intervall is [c,0]
                    //else it is [0,c]
                    //so [min(c,0),max(c,0)]
                    low.push(new MinNode(coeff,ConstNode.zero));
                    high.push(new MaxNode(coeff,ConstNode.zero));
                }else{//odd exponents
                    //low -=abs(coeffs)
                    //high +=abs(coeffs)
                    const abs=new AbsNode(coeff);
                    low.push(abs);
                    high.push(new NegNode(abs));
                }
            }
            ReturnIfIntervallDoesntContainZero_Statements.push(
                new custumStatementNode(
                    [new AddNode(...low),new AddNode(...high)],
                    (low, high)=>`if (!(${low} <= 0. && 0. <= ${high})) return false;`
                )
            );
        }
        ReturnIfIntervallDoesntContainZero_Statements.push(
            new custumStatementNode([],()=> "return true;")
        );
        return new BundlenodeNode(ReturnIfIntervallDoesntContainZero_Statements);
    
    }
  

}
