import * as mathjs from 'https://cdn.jsdelivr.net/npm/mathjs@14.5.2/+esm';

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
    toCss() {
       return `rgb(${Math.round(this.r * 255)}, ${Math.round(this.g * 255)}, ${Math.round(this.b * 255)})`;
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
        
    
        const Multivectors=new Map([["inputsVector",new Map()]]); // name -> Multivector of nodes
        const scalars=new Map(); // name -> node
    
        for(const [index, inputScalar] of json.inputScalars.entries()){
            let node;
            if(["_V_X","_V_Y","_V_Z"].includes(inputScalar))node=new VarNode(inputScalar);
            else node=new VarNode(inputScalar);
            
            graph.inputScalars.set(inputScalar, node);
            scalars.set(inputScalar, node);
            scalars.set("inputsVector["+index+"]", node);//gapp behaves weirdly and uses inputsVector[index] instead of name. currently it works only with tba
            Multivectors.get("inputsVector").set(index,node);
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
                    switch (func) {
                        case "abs":return new AbsNode(operand);
                        case "sqrt":return new SqrtNode(operand);
                        case "sin":return new sinNode(operand);
                        case "cos":return new cosNode(operand);
                        default:throw new Error(`Unknown function: ${func}`);
                    }
                case "Pow":
                    const exponent=parseExpression(node.right).eval();
                    const left=parseExpression(node.left);
                    
                    //return new MulNode(...Array(exponent).fill(left)); 
                    return powNode(left,exponent);

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
            graph.outputMultivectors.set(name, Multivectors.get(name)??new Map([[0,ConstNode.zero]]));
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
            VisualisationGraphs.push(new visualizationtargetnode(innerProductResultNodes,outputMultivectorName,color,this))
        }
        return VisualisationGraphs;
    }

    makeEvalcontext(){
        const ctx=new evalContext();
        ctx.registerParams(this.inputScalars.keys(),{ ignoreReserved : true });
        return ctx;
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
        },cache);
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
            variable = allnodes.find(x => x instanceof VarNode && x.varname == variable) ?? new VarNode(variable);
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

        derivs.getOrZero=function(x){return this.get(x)??ConstNode.zero;};
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
    equals(other) {
        return other instanceof ConstNode &&
               this.value === other.value;
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
        if(varname===undefined) throw new Error("varname undefined");
        
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
    isxyz(){
        return ["_V_X", "_V_Y", "_V_Z"].includes(this.varname);
    }
}

class AddNode extends ExpressionNode {
    constructor(...parents) {
        super(parents);
    }
    static of(...x){
        if(x.length==0)return ConstNode.zero;
        if(x.length==1)return x[0];
        return new AddNode(...x);
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


function powNode(basenode, exponent) {
    //generated by chatgpt
    if (exponent === 0) return ConstNode.one;
    if (exponent === 1) return basenode;

    if (exponent % 2 === 0) {
        const half = powNode(basenode, exponent / 2);
        return new MulNode(half, half);
    } else {
        const half = powNode(basenode, Math.floor(exponent / 2));
        return new MulNode(basenode, new MulNode(half, half));
    }
}

class MulNode extends ExpressionNode {
    constructor(...parents) {
        super(parents);
    }
    static of(...x) {
        if (x.some(t => ConstNode.zero.equals(t)))return ConstNode.zero;
        x = x.filter(t => !ConstNode.one.equals(t));
        if (x.length === 0) return ConstNode.one;
        if (x.length === 1) return x[0];

        return new MulNode(...x);
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
            return MulNode.of(rightacc, current);
        }, ConstNode.one);
        this.parents.reduce((leftacc, current, i) => {
            result[i] = MulNode.of(leftacc, result[i]);
            return MulNode.of(leftacc, current);
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
        const type=unifyTypesBinary(a.type,b.type);
        let code;
        if(a.type==NodeTypes.SCALAR)
            code=`(${a.code}/${b.code})`;
        else if(type==NodeTypes.COMPLEX)
            code=`ComplexDiv(${a.code},${b.code})`;
        else if(a.type==NodeTypes.INTERVALL && b.type==NodeTypes.SCALAR)
            code=`IntervallDiv(${a.code},${b.code})`;
        else throw Error("unknown div codegen case");
        return {type,code};
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
            if(this.type==NodeTypes.INTERVALL)return{type:this.type,code:`Intervall(${a.code})`};
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
class cosNode extends ExpressionNode {
    constructor(x) {
        super([x]);
    }
    clonewithnewparents(newparents) {
        return new this.constructor(...newparents);
    }
    compute(parentresults, variables) {
        return Math.cos(parentresults[0]);
    }
    codegenGLSL(parentResults) {
        // parentResults: [{ code, type }]
        const [a]=parentResults;
        if(a.type==NodeTypes.SCALAR){return{type:NodeTypes.SCALAR,code:`cos(${a.code})`};}
        throw Error("unknown sub codegen case");
    }
}
class sinNode extends ExpressionNode {
    constructor(x) {
        super([x]);
    }
    clonewithnewparents(newparents) {
        return new this.constructor(...newparents);
    }
    compute(parentresults, variables) {
        return Math.sin(parentresults[0]);
    }
    codegenGLSL(parentResults) {
        // parentResults: [{ code, type }]
        const [a]=parentResults;
        if(a.type==NodeTypes.SCALAR){return{type:NodeTypes.SCALAR,code:`sin(${a.code})`};}
        throw Error("unknown sub codegen case");
    }
}





function simplify_easy(root){
    function normalization(node) {
        if (!(node instanceof ExpressionNode)) return node;
        if (node.parents.length > 0 && node.parents.every(x => x instanceof ConstNode))//constantantfolding
            return new ConstNode(node.eval());
        if (node instanceof MulNode && node.parents.some(x => ConstNode.zero.equals(x)))
            return ConstNode.zero;
        //if (node.parents.length == 1 && (node instanceof MulNode || node instanceof AddNode))return node.parents[0];
        if(node instanceof MulNode || node instanceof AddNode){
            let constantfactors = node.parents.filter(x => x instanceof ConstNode);
            //console.log(constantfactors.map(x=>x.value));
            let newparents = node.parents.filter(x => !(x instanceof ConstNode));

            if (constantfactors.length > 0) {
                /** @type {ConstNode} */
                let constantfactor;
                if (constantfactors.length > 1)
                    constantfactor = new ConstNode((new node.constructor(...constantfactors)).eval());
                else if (constantfactors.length == 1)
                    constantfactor = constantfactors[0];

                if(constantfactor.value == -1 && node instanceof MulNode)
                    return new NegNode(node.clonewithnewparents(newparents));
                if (!(
                    (constantfactor.value == 1 && node instanceof MulNode) ||
                    (constantfactor.value == 0 && node instanceof AddNode)
                )) newparents.push(constantfactor);
                //else console.log("discard");
            }
            if (newparents.length == 1) return newparents[0];
            return node.clonewithnewparents(newparents);
        }
        return node;
    }

    //noemalization constantantfolding cse
    let cse = new CommonSubexpressionElimination();
    return root.visitnodesrec((node, parentreplacements) => {
        let nodereplacement = node.clonewithnewparents(parentreplacements);
        nodereplacement = normalization(nodereplacement);
        nodereplacement = cse.getreplacement(nodereplacement);
        return nodereplacement;
    });
};

function simplify(root) {
    //console.log("unoptimized",codegenGLSLTyped(node));

    function normalization(node) {
        if (!(node instanceof ExpressionNode)) return node;
        if ((node instanceof CastNode)) return node;
        if (node.parents.length > 0 && node.parents.every(x => x instanceof ConstNode))//constantantfolding
            return new ConstNode(node.eval());
        if (node instanceof NegNode)
            return new MulNode(ConstNode.minusone, node.parents[0]);
        if (node instanceof SubNode)
            return new AddNode(node.parents[0], new MulNode(ConstNode.minusone, node.parents[1]));
        if (node instanceof DivNode && node.parents[1] instanceof ConstNode)
            return new MulNode(node.parents[0], new ConstNode(1 / node.parents[1].value));
        if (node instanceof MulNode && node.parents.some(x => ConstNode.zero.equals(x)))
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

    //return root;

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
        if (node instanceof MulNode && parentreplacements.some(x => ConstNode.minusone.equals(x))) {//insert neg nodes instead of x*-1
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
            const neg = AddNode.of(...negs);
            if (poss.length == 0) return new NegNode(neg);
            const pos = AddNode.of(...poss);
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
                if (node.isxyz()) return { dependsonxyz: true, dependsonvariables: false };
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
    constructor(nodes, name, color,gagraph) {
        super(nodes);
        this.color = color;
        this.nodes = nodes,
        this.name = name;
        this.gagraph=gagraph;
    }

    clonewithnewparents(newparents) {
        return new this.constructor(newparents, this.name, this.color);
    }



    static #generateFunctionCode( header,body) {
        let optomized =body;
        //optomized = new CommonSubexpressionElimination().getreplacement(body);
        optomized = simplify(body);
        //optomized = simplify_easy(body);
        const functionbody = codegenGLSLTyped(optomized);
        const code = header.replace("?", "\n" + functionbody + "\n");
        return code;
    }

    static #replacexyz(root, x, y, z) {
        return root.copyGraph((original) => {
            if (original instanceof VarNode) {
                if (original.varname == "_V_X") { return x; }
                if (original.varname == "_V_Y") { return y; }
                if (original.varname == "_V_Z") { return z; }
            }
        });
    }

        
    static #rayify(subgraphxyz,type=NodeTypes.SCALAR){
        const a = new VarNode("a",type);
        const x = new AddNode(new VarNode("rayOrigin.x"), new MulNode(a, new VarNode("rayDir.x")));
        const y = new AddNode(new VarNode("rayOrigin.y"), new MulNode(a, new VarNode("rayDir.y")));
        const z = new AddNode(new VarNode("rayOrigin.z"), new MulNode(a, new VarNode("rayDir.z")));
        return visualizationtargetnode.#replacexyz(subgraphxyz,x,y,z);
    }

    generatecode2() {
        const generateFunctionCode=visualizationtargetnode.#generateFunctionCode;
        const replacexyz=visualizationtargetnode.#replacexyz;
        const rayify=visualizationtargetnode.#rayify;

        function summofsquares(nodes) {
            const squares=nodes.map(n => new MulNode(n, n));
            if(nodes.length==1)return squares[0];
            return new AddNode(...squares);
        }

        

        function returnvec4node(x,y,z,w){
            return new custumStatementNode(
                [x,y,z,w],
                (x,y,z,w)=>`return vec4(${x},${y},${z},${w});`
            );
        }

        
        const root=new BundlenodeNode(this.parents);
        const { nodetosubgraphname, subgraph:subgraphxyz } = splitgraph(root, ["_V_X", "_V_Y", "_V_Z"]);
        
        

        //function setInputtype()

        
        const replacements=new Map();
        
        const issquared=+(subgraphxyz.parents.length!=1);
        const subgraphxyzsus = issquared?summofsquares(subgraphxyz.parents):subgraphxyz.parents[0];
        {
            //xyzDual xyzDualSummofsquares(vec3 pos) {?}//deriv xyz sus     
            const dfd_=subgraphxyzsus.backpropergationwithdefault();
            /*function dfd_(x){//same with forwardmode autodiff
                return subgraphxyzsus.forwardpropergation(x).get(subgraphxyzsus)??ConstNode.zero;
            }*/
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


        /*{
            
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
        }*/




        const POLYDEGREE=subgraphxyzsus.visitnodesrec(
            (node,parentresults)=>{
            if(node instanceof VarNode){
                if(["_V_X","_V_Y","_V_Z"].includes(node.varname))return 1;
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
        replacements.set("#define USE_DOUBLEROOTS ?",`#define USE_DOUBLEROOTS ${issquared}`);

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


        const argnodes=Array(nodetosubgraphname.size);
        for(const [node,name] of nodetosubgraphname){
            const m = /^args\[(\d+)\]$/.exec(name);
            if(!m)throw new Error("regex mismatch");
            const index=Number(m[1]);
            if (index < 0 || index >= nodetosubgraphname.size || argnodes[index] !== undefined)throw new Error("invalid or duplicate index");
            argnodes[index]=node;
        }

        
        //TODO generate code for basis

        return {codereplacements:replacements,nodetosubgraphname,argnodes};


        
    }

    generatecodeR(){
        const generateFunctionCode=visualizationtargetnode.#generateFunctionCode;
        const replacexyz=visualizationtargetnode.#replacexyz;
        const rayify=visualizationtargetnode.#rayify;

        const replacements=new Map();
        const{basis,matrix,basispolys}=matrixextractor2.ultimateSolution(new BundlenodeNode(this.parents));
        //const{basis,matrix,basispolys}=matrixextractor2.extractbasis3(new BundlenodeNode(this.parents));
        //const{basis,matrix,basispolys}=matrixextractor2.extractmonomM(new BundlenodeNode(this.parents));
        //const{basis,matrix,basispolys}=matrixextractor2.extractbasis4(new BundlenodeNode(this.parents),this.gagraph);
        const matrixsize=matrix[0].length;

        replacements.set("numoutputs=?",`numoutputs=${this.parents.length}`);
        replacements.set("basislength=?",`basislength=${matrixsize}`);
        //replacements.set("Rflat=?",`basislength=${matrixsize}`);

        const degree=Math.max(...basispolys.map(poly=>poly.degree()));
        replacements.set("basismaxdegree=?",`basismaxdegree=${degree}`);
        
        {
            const ki=[...Array(degree+1).keys()];
            const chebichev=ki.map((k)=>Math.cos((2*k+1)*Math.PI/(2*(degree+1))));
            const Vandermonde=chebichev.map(x=>ki.map(p=>x**p));
            const inv=mathjs.inv(Vandermonde);
            const flat=inv.flat();
            console.log(inv.flat().join(", "));
            const s= inv.flat().map(x=>"float("+x+")").join(", ");
            const arr='const float[(basismaxdegree+1)*(basismaxdegree+1)] Vinv = float[]('+s+')';
            replacements.set("const float[(basismaxdegree+1)*(basismaxdegree+1)] Vinv = float[](?)",arr);

        }
        

        {
            const basisray=rayify(basis,NodeTypes.COMPLEX);
            //void DualComplexP(vec3 rayDir, vec3 rayOrigin,float a,out DualComplex[basislength] P) {?}
            const d_da=basisray.forwardpropergation("a");
            const body=new BundlenodeNode(basisray.parents.map((resulti,i)=>
                new custumStatementNode(
                    [
                        new CastNode(resulti,NodeTypes.COMPLEX),
                        new CastNode(d_da.get(resulti)??ConstNode.zero,NodeTypes.COMPLEX)
                    ],
                    (strresulti,strdresultida)=>`P[${i}]=vec4(${strresulti},${strdresultida});`
                )
            ));//:)
            const header="void makeDualComplexP(vec3 rayDir, vec3 rayOrigin,Complex a,out DualComplex[basislength] P) {?}";
            replacements.set(header,generateFunctionCode(header,body));   
        }

        {
            const basisray=rayify(basis);
            //void DualP(vec3 rayDir, vec3 rayOrigin,float a,out DualComplex[basislength] P) {?}
            const d_da=basisray.forwardpropergation("a");
            const body=new BundlenodeNode(basisray.parents.map((resulti,i)=>
                new custumStatementNode(
                    [resulti,d_da.getOrZero(resulti)],
                    (strresulti,strdresultida)=>`P[${i}]=vec2(${strresulti},${strdresultida});`
                )
            ));//:)
            const header="void makeDualP(vec3 rayDir, vec3 rayOrigin,float a,out Dual[basislength] P) {?}";
            replacements.set(header,generateFunctionCode(header,body));   
        }

        {
            const basisxyz=replacexyz(basis,...["pos.x","pos.y","pos.z"].map(v=>new VarNode(v)));
            //void P(vec3 pos,out float[basislength] P) {?}
            const body=new BundlenodeNode(basisxyz.parents.map((resulti,i)=>
                new custumStatementNode(
                    [resulti],
                    (strresulti)=>`P[${i}]=${strresulti};`
                )
            ));//:)
            const header="void makeP(vec3 pos,out float[basislength] P) {?}";
            replacements.set(header,generateFunctionCode(header,body));
        }

        {
            const basisxyz=replacexyz(basis,...["pos.x","pos.y","pos.z"].map(v=>new VarNode(v)));
            //void xyzDualP(vec3 pos,out xyzDual[basislength] P) {?}
            const d_dx=basisxyz.forwardpropergation("pos.x");
            const d_dy=basisxyz.forwardpropergation("pos.y");
            const d_dz=basisxyz.forwardpropergation("pos.z");
            const body=new BundlenodeNode(basisxyz.parents.map((resulti,i)=>
                new custumStatementNode(
                    [resulti,d_dx.getOrZero(resulti),d_dy.getOrZero(resulti),d_dz.getOrZero(resulti)],
                    (ri,dridx,dridy,dridz)=>`P[${i}]=vec4(${dridx},${dridy},${dridz},${ri});`
                )
            ));//:)
            const header="void makexyzDualP(vec3 pos,out xyzDual[basislength] P) {?}";
            replacements.set(header,generateFunctionCode(header,body));
        }

        {
            const basisxyz=replacexyz(basis,...["X","Y","Z"].map(v=>new VarNode(v,NodeTypes.INTERVALL)));
            const body=new BundlenodeNode(basisxyz.parents.map((resulti,i)=>
                new custumStatementNode(
                    [new CastNode(resulti,NodeTypes.INTERVALL)],
                    (ri)=>`P[${i}]=${ri};`
                )
            ));//:)
            const header="void makeIntervallP(Intervall X,Intervall Y,Intervall Z,out Intervall[basislength] P) {?}";
            replacements.set(header,generateFunctionCode(header,body));
        }

        {
            //void MatmulRDense(vec4[basislength] x,out vec4[basislength] b){?}
            //void MatmulRDense(vec2[basislength] x,out vec2[basislength] b){?}
            const n=matrixsize;
            let ri=0;
            let body="\n";
            for(let i=0;i<n;i++){
                const acc=[];
                for(let j=n - 4*Math.ceil((n-i)/4);j<n;j++){
                    if(j>=i)acc.push(`P[${j}]*RDense[${Math.floor(ri/4)}][${ri%4}]`);
                    ri++;
                }
                body+=`\nb[${i}]=`+acc.join("+")+";";
            }
            const header="void MatmulRDense(vec4[basislength] P,out vec4[basislength] b){?}";
            const fullfunctioncode=header.replace("?",body);
            replacements.set(header,fullfunctioncode);
            replacements.set(header.replaceAll("vec4","vec2"),fullfunctioncode.replaceAll("vec4","vec2"));
        }
        {
            //float susRDenseUnrolled(vec3 pos){
            let body="vec4[basislength4] Pvec4;\nmakePvec4r(pos,Pvec4);\nfloat res=0.;"
            const n=matrixsize;
            let ri=0;
            for(let i=0;i<n;i++) {
                let acc=[];
                //const offset=//should be the same as -
                for(let j=Math.ceil(n/4)-Math.ceil((n-i)/4);j<Math.ceil(n/4);j++){
                    acc.push(`dot(Pvec4[${j}],RDense[${ri++}])`);
                }
                body+="\nres+=square("+acc.join("+")+");";    
            }
            body+="\nreturn res;\n";
            const header="float susRDenseUnrolled(vec3 pos){?}";
            replacements.set(header,header.replace("?",body));
        }


        return {codereplacements:replacements,matrix,basispolys};
    }

    generatecode2cached(){
        if(!this.cachegeneratecode2)this.cachegeneratecode2=this.generatecode2();
        return this.cachegeneratecode2;
    }
    generatecodeRcached(){
        if(!this.cachegeneratecodeR)this.cachegeneratecodeR=this.generatecodeR();
        return this.cachegeneratecodeR;
    }



    gencode(template){
        for(const [k,v]of this.generatecode2cached().codereplacements.entries())
            template=template.replace(k,v);
        return template;
    }
    gencodeR(template){
        for(const [k,v]of this.generatecodeRcached().codereplacements.entries())
            template=template.replace(k,v);
        return template;
    }

    setuniformsargs(shader,evalcontext){
        /*this.generatecode2cached().nodetosubgraphname.entries().forEach(([node,name]) => {
            const value=node.eval(variables,cache);
            //console.log(name,value)
            shader.uniform1f(name,value);
        });*/
        if(shader.resolveUniformLocation("args")===null)return;
        const args=new Float32Array(this.generatecode2cached().argnodes.map(node=>evalcontext.eval(node)));
        shader.uniform1fv("args",args);
        

    }
    setuniformsR(shader,evalcontext){
        if(shader.resolveUniformLocation("R")===null && shader.resolveUniformLocation("RDense")===null)return;
        const{matrix,basispolys}=this.generatecodeRcached();
        const M=matrix.map(row=>row.map(node=>evalcontext.eval(node)));
        const R=mathjs.qr(M).R;
        const n=M[0].length;
        const tol = 1e-12;
        const rank=R.findLastIndex(row =>row.some(x => Math.abs(x) > tol))+1;
        const Rflat=R.flatMap((row,i)=>row.slice(i));
        const degree=rank === 0 ? 0:Math.max(...basispolys.slice(rank-1).map(poly=>poly.degree()));
        const Rflatpad=new Float32Array(n*(n+1)/2);
        Rflatpad.set(Rflat);
        shader.uniform1fv("R",Rflatpad);
        shader.uniform1i("rank",rank);
        shader.uniform1i("degree",degree);


        const Rfull=R.slice();
        while(Rfull.length<n)Rfull.push(new Array(n).fill(0));//padd with 0s to nxn
        let RDense=[]; 

        const n4=Math.ceil(n/4)*4;
        for(let i=0;i<n;i++){
            for(let j=n - 4*Math.ceil((n-i)/4);j<n;j++){
                if(j<i)RDense.push(0);
                else RDense.push(Rfull[i][j]);
            }
        }
        shader.uniform4fv("RDense",new Float32Array(RDense));

    }

    setuniforms(shader,evalcontext){
        this.setuniformsargs(shader,evalcontext);
        this.setuniformsR(shader,evalcontext);
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

    return expressions;

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
            if (node.parents.length === 0) return inter3d.convert(node);//const and var
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
                    low.push(new NegNode(abs));
                    high.push(abs);
                }
            }
            ReturnIfIntervallDoesntContainZero_Statements.push(
                new custumStatementNode(
                    [AddNode.of(...low),AddNode.of(...high)],
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

function maxBy(iter, key) {
    let bestItem = undefined;
    let bestValue = -Infinity;

    for (const item of iter) {
        const value = key(item);
        if (value > bestValue) {
            bestValue = value;
            bestItem = item;
        }
    }

    return bestItem;
}


import { Poly } from "../../util/poly.js";
class matrixextractor2{
    constructor(vistarget){

    }


    static ismultiple(poly1,poly2){
        const eps=1e-9;
        
        const poly1zero=poly1.isZero();
        const poly2zero=poly2.isZero();
        if (poly1zero && poly2zero) return 1;
        if (poly1zero || poly2zero) return false;
        const [pivotm,c1] =maxBy(poly1.coeffs.entries(),([m,c])=>Math.abs(c)); 
        const c2=poly2.coeffs.get(pivotm);
        if (c2==null || Math.abs(c2) < eps) return false;
        
        const k = c1 / c2;
        for(const m of new Set([...poly1.coeffs.keys(),...poly2.coeffs.keys()])){ 
            const coeff1=(poly1.coeffs.get(m)??0); 
            const coeff2=(poly2.coeffs.get(m)??0)*k;
            const diff = coeff1 - coeff2;
            const tol = eps * Math.max(1, Math.abs(coeff1), Math.abs(coeff2));
            if (Math.abs(diff) > tol)
                return false;
        } 
        return k; //poly1=k*coeff2
    }
    static applyoptopolys(node,parentresults){
        if(node instanceof VarNode){return Poly.var(node.varname);
        }else if(node instanceof AddNode)return parentresults.reduce((a,b)=>a.add(b));
        else if(node instanceof SubNode)return parentresults[0].sub(parentresults[1]);
        else if(node instanceof NegNode)return parentresults[0].mul(-1);
        else if(node instanceof MulNode)return parentresults.reduce((a,b)=>a.mul(b));
        else if(node instanceof ConstNode)return Poly.convert(node.value);
        else if(node instanceof DivNode)return parentresults[0].div(parentresults[1]);
        throw new Error("unknown nodetype for polydegree calc");
    }

    static extractbasis2(root){
        
        
        

        const basisPolys = [
            { node: ConstNode.one, poly: Poly.convert(1), ops: 1 }
        ]; // list of {node, poly, ops}
        const equivalenceClassIndex = new Map(); // node => index of basisPolys
    
        root.visitnodesrec((node, parentResults) => {
            // skip nodes that are undefined or not xyz
            if (parentResults.some(x => x === undefined)) return undefined;
            if (node instanceof VarNode && !node.isxyz())return undefined;

            // compute parent set (for ops)
            const parentSet = new Set([node]);
            for (const p of parentResults) for (const x of p.parentSet) parentSet.add(x);
            const ops = parentSet.size;//rough metric for how much ops this took

            // compute polynomial
            const poly = matrixextractor2.applyoptopolys(node, parentResults.map(x => x.poly));


            const i = basisPolys.findIndex(({ poly: basisPoly }) => poly.isMultipleOf(basisPoly));
            if (i !== -1) { // try to find a matching basis polynomial
                equivalenceClassIndex.set(node, i);
                if (ops < basisPolys[i].ops) basisPolys[i] = { node, poly, ops };// replace basisPoly if this node has fewer ops
            } else { // add new basis poly if none found
                basisPolys.push({ node, poly, ops });
                equivalenceClassIndex.set(node, basisPolys.length - 1);
            }

            return { poly, parentSet };
        });



        const handles=new Map();
        let handelidcounter=0;

        const linearmapping=new Map();
        root.visitnodesrec((node,parentresults)=>{
            if(node instanceof BundlenodeNode)return;
            if(equivalenceClassIndex.has(node)){//if the node is part of the basis
                const index=equivalenceClassIndex.get(node);
                const basis=basisPolys[index];
                const poly=polys.get(node);
                const multiplyer=poly.isMultipleOf(basis.poly);//ismultiple(poly,basis.poly);
                if(!multiplyer)throw new Error("polys arent multiples");// this should never be true and is just a sanity check
                return {poly:Poly.var(`basis[${index}]`).mul(multiplyer),dependsonxyz:true};
            }
            if(!parentresults.some(x=>x.dependsonxyz)){
                const handle=`node[${handelidcounter++}]`;
                handles.set(handle,node);
                return {poly:Poly.var(handle),dependsonxyz:false};
            }

            const parentpolys=parentresults.map(x=>x.poly);
            let result;
            if(node instanceof VarNode){
                throw new Error("this should always be handled by the other cases");
            }else if(node instanceof AddNode)result= parentpolys.reduce((a,b)=>a.add(b));
            else if(node instanceof SubNode)result= parentpolys[0].sub(parentpolys[1]);
            else if(node instanceof NegNode)result= parentpolys[0].mul(-1);
            else if(node instanceof MulNode)result= parentpolys.reduce((a,b)=>a.mul(b));//also shouldnt happen exept for constants
            else if(node instanceof ConstNode)//result= Poly.convert(node.value);//also should be handled by handle
                throw new Error("this should always be handled by the other cases");
            else if(node instanceof DivNode)result= parentpolys[0].div(parentpolys[1]);
            else throw new Error("unknown nodetype for polydegree calc");

            return {poly:result,dependsonxyz:true};

            //node only dependant on non basis (so not on xyz) return handle
            //otherwise return the polynomial
        },linearmapping);
        
        

        for(let i=0;i<basisPolys.length;i++){
            console.log(i);
            for(const [node,index] of equivalenceclassindex.entries()){
                if(i==index)
                    console.log(polys.get(node).toString());
            }
        }
        console.log("-----------------");
        const matrix=[];
        for(const outputnode of root.parents){
            const polymap=linearmapping.get(outputnode).poly;
            //console.log(polymap.toString());
            const row=Array.from({ length: basisPolys.length }, () => []);
            for(const [monom,coeff] of polymap.entries()){
                const basishandles=[];
                const nodehandles=[];
                for(const [varname,exponent] of Object.entries(monom)){
                    if(exponent!=1)throw new Error("non linear");
                    if(varname.startsWith("basis"))basishandles.push(varname);
                    else if(varname.startsWith("node"))nodehandles.push(varname);
                    else throw new Error("unknown string");
                }
                if(basishandles.length>1)throw new Error("non linear");//the basisextraction didnt work rightbecause of unexpected graphstructure
                
                const basisindex=Number((basishandles[0]??"basis[0]").match(/basis\[(\d+)\]/)[1]);
                //if(row[basisindex]!=ConstNode.zero)throw new Error("multiple entries");
                let node=MulNode.of(...nodehandles.map(x=>handles.get(x)),new ConstNode(coeff));
                row[basisindex].push(node);

            }
            matrix.push(row.map((x)=>AddNode.of(...x)));
            //if()
        }
        console.log(matrix);





    }



    static extractbasis3(root,forcemonomialbasis=false){
        
        
        matrixextractor2.extractBasisMSG(root);

        const basisPolys = [{ node: ConstNode.one, poly: Poly.one, ops: 1 }]; // list of {node, poly, ops}. I added 1 already
        const equivalenceClassIndex = new Map(); // node => index of basisPolys
        const basisextractioncache=new Map();//node=>{poly,parentSet}
        /**
         * adds the root to the basispolys
         * @param {*} root 
         * @returns wheather the node soly depends on xyz
         */
        function basisextraction(root){ 
            root.visitnodesrec((node, parentResults) => {//null means not bart of basis
                // skip nodes that are dependant on variables which are not xyz and therefore not part of the basis
                if (parentResults.some(x => x === null)) return null;
                if (node instanceof VarNode && !node.isxyz())return null;

                // compute parent set (for ops)
                const parentSet = new Set([node]);
                for (const p of parentResults) for (const x of p.parentSet) parentSet.add(x);//merge sets
                const ops = parentSet.size;//rough metric for how much ops this took

                // compute polynomial
                const poly = matrixextractor2.applyoptopolys(node, parentResults.map(x => x.poly));
                if (forcemonomialbasis&&!poly.isMonomial()) return null;//this way we reject non monomials

                const i = basisPolys.findIndex(({ poly: basisPoly }) => poly.isMultipleOf(basisPoly));
                if (i !== -1) { // try to find a matching basis polynomial
                    equivalenceClassIndex.set(node, i);
                    if (ops < basisPolys[i].ops) basisPolys[i] = { node, poly, ops };// replace basisPoly if this node has fewer ops
                } else { // add new basis poly if none found
                    basisPolys.push({ node, poly, ops });
                    equivalenceClassIndex.set(node, basisPolys.length - 1);
                }

                return { poly, parentSet };
            },basisextractioncache);
            return basisextractioncache.get(root)!==null;
        }


        const handles=new Map();//handletonode
        const nodetohandle=new Map();
        let handelidcounter=0;
        function makehandlepoly(node){
            if(nodetohandle.has(node))return Poly.var(nodetohandle.get(node));
            const handle=`node[${handelidcounter++}]`;
            handles.set(handle,node);
            nodetohandle.set(node,handle);
            return Poly.var(handle);
        }

        const linearmapping=new Map();
        root.visitnodesrec((node,parentResults)=>{
            if(node instanceof BundlenodeNode)return;

            if(node instanceof ConstNode)return {poly:Poly.constant(node.value),dependsonxyz:false};//this needs to be before the rest because dependsolyonxyz is true for ConstNode

            const dependsolyonxyz=basisextraction(node);

            if(dependsolyonxyz && node instanceof VarNode){
                return {poly:makehandlepoly(node),dependsonxyz:true};//every entry of the basis gets its own handle
            }

            if(!parentResults.some(x=>x.dependsonxyz)){
                return {poly:makehandlepoly(node),dependsonxyz:false};//every entry independant of the basis gets a handle
            }

            //the rest are combinations of basis and non basis handles
            if(node instanceof VarNode)throw new Error("this should always be handled by the other cases");//specifically the independant of basis case
            return {poly:matrixextractor2.applyoptopolys(node, parentResults.map(x => x.poly)),dependsonxyz:true}
        },linearmapping);
        
        const polysout=root.parents.map((outputnode)=>{//linearizees the poly basis. this is only nessesary if it is "optimized" in gaalop
            let polyout=linearmapping.get(outputnode).poly;
            const acc=Poly.zero;
            for(const [monom,coeff] of polyout.entries()){
                const basisnodes=[];
                let monomacc=Poly.constant(coeff);
                for(const [varname,exponent] of Object.entries(monom)){
                    //if(exponent!=1)throw new Error("non linear");
                    const monompartnode=handles.get(varname);
                    const isbasis=basisextraction(monompartnode);
                    
                    if(isbasis)basisnodes.push(powNode(monompartnode,exponent));
                    else       monomacc=monomacc.mul(Poly.monom(varname,exponent));
                }
                //if(basishandles.length>1)throw new Error("non linear");//the basisextraction didnt work rightbecause of unexpected graphstructure
                const basisnode=MulNode.of(...basisnodes);
                basisextraction(basisnode);//extendthe basis the basis
                
                acc.addip(monomacc.mul(makehandlepoly(basisnode)));
            }
            return acc;
        });

        //const polybasismap=new Map(basisPolys.map((e,i)=>[`basis[${i}]`,e]));

        const usedbasisindicees=new Set();
        const rowmaps=polysout.map((polyout)=>{
            const normalizedPoly=Poly.zero;//TODO normalize poly das heisst potentielle basiselemente durch equivalence poly aus basis ersetzen
            for(const [monom,coeff] of polyout.entries()){
                let monomacc=Poly.constant(coeff);
                for(const [varname,exponent] of Object.entries(monom)){
                    
                    const monompartnode=handles.get(varname);
                    const isbasis=basisextraction(monompartnode);

                    if(isbasis){//we search for the basis
                        if(exponent!=1)throw new Error("non linear");
                        const index=equivalenceClassIndex.get(monompartnode);
                        const basis=basisPolys[index];
                        usedbasisindicees.add(index);
                        const poly=basisextractioncache.get(monompartnode).poly;
                        const multiplyer=poly.isMultipleOf(basis.poly);//ismultiple(poly,basis.poly);
                        if(!multiplyer)throw new Error("polys arent multiples");// this should never be true and is just a sanity check
                        monomacc=monomacc.mul(Poly.var(`basis[${index}]`,multiplyer));//and replace the basis
                    }else{
                        monomacc=monomacc.mul(Poly.monom(varname,exponent));
                    }
             
                }
                normalizedPoly.addip(monomacc);
            }

            const rowmapofsums=new Map();//basis=>node[]     //umwandeln in form basis=>coeff
            for(const [monom,coeff] of normalizedPoly.entries()){
                let monomprod=[];
                let basises=[];
                for(const [varname,exponent] of Object.entries(monom)){
                    
                    //const monompartnode=handles.get(varname);
                    //const isbasis=basisextraction(monompartnode);

                    if(varname.startsWith("basis")){
                        if(exponent!=1)throw new Error("non linear");
                        basises.push(varname);                    
                    }else{
                        monomprod.push(powNode(handles.get(varname),exponent));
                        //monomacc=monomacc.mul(Poly.monom(varname,exponent));
                    }
             
                }
                if(basises.length>1)throw new Error("non linear");
                const basis=basises[0]??"basis[0]";
                if(!rowmapofsums.has(basis))rowmapofsums.set(basis,[]);
                rowmapofsums.get(basis).push(MulNode.of(...monomprod,new ConstNode(coeff)));
                
            }

            const rowmap=new Map(rowmapofsums.entries().map(([k,v])=>[k,AddNode.of(...v)]));
            return rowmap;
        });

        const basisindicees=[...usedbasisindicees].sort((a, b) => {
            const degA = basisPolys[a].poly.degree();
            const degB = basisPolys[b].poly.degree();
            return degB - degA; // higher degree first
        });
        const basis=new BundlenodeNode(basisindicees.map(i=>basisPolys[i].node));
        const matrix=rowmaps.map((rowmap)=>basisindicees.map(i=>rowmap.get(`basis[${i}]`)??ConstNode.zero));
        const basispolys=basisindicees.map(i=>basisPolys[i].poly);


 
        for(let i=0;i<basisPolys.length;i++){
            console.log(i);
            for(const [node,index] of equivalenceClassIndex.entries()){
                if(i==index)
                    console.log(basisextractioncache.get(node).poly.toString());
            }
            console.log("ops ",basisPolys[i].ops); 
            console.log("poly ",basisPolys[i].poly.toString());
            console.log(codegenGLSLTyped(new custumStatementNode([basisPolys[i].node],(code)=>code)));
            console.log("-----------------------------");
        }
        console.log(basisindicees);
        console.log(matrix);
        return {basis,matrix,basispolys};


    }


    static extractbasis4(root,gagraph,forcemonomialbasis=false){
        const point=gagraph.allMultivectors.get("_V_POINT");//
        if(!point || forcemonomialbasis)return matrixextractor2.extractbasis3(root,forcemonomialbasis);//try the old code

        //lets first make P
        const P=new Map();//handle->{node,poly} 
        //the first element is always "P[0]"->{node:ConstNode.one,poly:Poly.one} 

        const linearmappings=new Map();//node->linmap
        //linmap: poly of handles
        const nodetoxyzpolycache=new Map();
        let phandelidcounter=0;
        for(const pointbladenode of [ConstNode.one,...point.values()]){
            const xyzpoly=pointbladenode.visitnodesrec((node,parentResults)=>{
                if(node instanceof VarNode && !node.isxyz())throw new Error("point contains bad variable");
                return matrixextractor2.applyoptopolys(node, parentResults);
            },nodetoxyzpolycache);

            let multiplyer=1;
            let handle=null;
            for(const [h,{n,poly}]of P.entries()){
                const m=xyzpoly.isMultipleOf(poly);
                //xyzpoly = m * poly or m is false
                if(m){multiplyer=m;handle=h;break;}
            }
            if(handle===null){
                handle=`P[${phandelidcounter++}]`;
                P.set(handle,{node:pointbladenode,poly:xyzpoly});
            }

            linearmappings.set(pointbladenode,Poly.var(handle,multiplyer));//populate the thing for elements of P
        }

        const handletonode=new Map();//handletonode
        const nodetohandle=new Map();
        let handelidcounter=0;
        function makehandlepoly(node){
            if(nodetohandle.has(node))return Poly.var(nodetohandle.get(node));
            const handle=`node[${handelidcounter++}]`;
            handletonode.set(handle,node);
            nodetohandle.set(node,handle);
            return Poly.var(handle);
        }

        const nodedependencies=new Map();
        root.visitnodesrec((node,parentResults)=>{
            if(node instanceof VarNode){
                if(node.isxyz())return {xyz:true,const:false,var:false};
                else return {xyz:false,const:false,var:true};
            }else if(node instanceof ConstNode)  return {xyz:false,const:true,var:false};
            return {
                xyz:parentResults.some(x=>x.xyz),
                const:parentResults.some(x=>x.const),
                var:parentResults.some(x=>x.var)
            }
        },nodedependencies);
        

        

        /*root.visitnodesrec((node,parentResults)=>{
            if(node instanceof VarNode){
                if(node.isxyz())throw new Error("multiplikation isnt linear.try without optimizations or modify this function to always use the old code lol");
                return makehandlepoly(node);
            } 
            return matrixextractor2.applyoptopolys(node, parentResults);
        },linearmappings);*/
        const usedbasishandles=new Set();

        const rowmaps=root.parents.map((n)=>{
            const linearmap=n.visitnodesrec((node,parentResults)=>{
                if(node instanceof VarNode && node.isxyz())throw new Error("multiplikation isnt linear.try without optimizations or modify this function to always use the old code lol");
                const dependencies=nodedependencies.get(node);
                if(!dependencies.xyz)makehandlepoly(node);
                return matrixextractor2.applyoptopolys(node, parentResults);
            },linearmappings);

            const rowmapofsums=new Map();
            for(const [monom,coeff] of linearmap.entries()){
                let monomprod=[];
                let basises=[];
                for(const [varname,exponent] of Object.entries(monom)){
                    
                    //const monompartnode=handles.get(varname);
                    //const isbasis=basisextraction(monompartnode);

                    if(varname.startsWith("P")){
                        if(exponent!=1)throw new Error("non linear");
                        basises.push(varname);                    
                    }else{
                        monomprod.push(powNode(handles.get(varname),exponent));
                        //monomacc=monomacc.mul(Poly.monom(varname,exponent));
                    }
             
                }
                if(basises.length>1)throw new Error("non linear");
                const basis=basises.filter(x=>x!="P[0]")[0]??"P[0]";
                if(!rowmapofsums.has(basis))rowmapofsums.set(basis,[]);
                rowmapofsums.get(basis).push(MulNode.of(...monomprod,new ConstNode(coeff)));
                usedbasishandles.add(basis);
                
            }
            const rowmap=new Map(rowmapofsums.entries().map(([k,v])=>[k,AddNode.of(...v)]));

            return rowmap;
        });

         const basishandles=[...usedbasishandles].sort((a, b) => {
            const degA = P.get(a).poly.degree();
            const degB = P.get(b).poly.degree();
            return degB - degA; // higher degree first
        });
        const basis=new BundlenodeNode(basishandles.map(h=>P.get(h).node));
        const matrix=rowmaps.map((rowmap)=>basishandles.map(h=>rowmap.get(h)??ConstNode.zero));
        const basispolys=basishandles.map(h=>P.get(h).poly);

        return {basis,matrix,basispolys};



    }

    static extractBasisMSG(root,monomialkeysfilter=undefined){

        const xyzpolys=new Map();
        

        let monomialkeys=new Set();
        for(const bladenode of [ConstNode.one,...root.parents])//i add 1 because otherwise this is buggy :>
            bladenode.visitnodesrec((node,parentResults)=>{
                //discard polys independant of xyz
                if(parentResults.some(x=>x===undefined))return undefined;
                if(node instanceof VarNode && !node.isxyz())return undefined;

                //compute new poly
                const poly=matrixextractor2.applyoptopolys(node,parentResults.map(p=>p.poly));

                //collect monomial basis keys
                for(const k of poly.coeffs.keys())monomialkeys.add(k);

                
                //calc ops
                const parentSet = new Set([node]);
                for (const p of parentResults) for (const x of p.parentSet) parentSet.add(x);//merge sets
                const ops = parentSet.size;

                return {poly,ops,parentSet};
            },xyzpolys);
        
        //optionally i could add a constant factor of 1


        
        monomialkeys=[...monomialkeys];
        //const S=[];
        //const xyznodes=[];


        const monomialbasisfilter=new Set(monomialkeysfilter??monomialkeys);

        const xyzpolyslist=[]
        for(const [node,candidate]of xyzpolys){
            if(candidate===undefined)continue;

            const isSubset = [...candidate.poly.coeffs.keys()].every(m => monomialbasisfilter.has(m));
            if(!isSubset)continue;

            const coeffs=candidate.poly.coeffs; const ops=candidate.ops;
            const coefflist=monomialkeys.map(monomkey=>coeffs.get(monomkey)??0);
            //S.push(coefflist);
            //xyznodes.push(node);
            xyzpolyslist.push({coefflist,node,ops});
        }

        xyzpolyslist.sort((a,b)=>(a.ops-b.ops));

        const {E,keep}=MSG(xyzpolyslist.map(x=>x.coefflist));

        const basisnodes=keep.map(i=>xyzpolyslist[i].node);
        const basispolys=basisnodes.map(n=>xyzpolys.get(n).poly);
        const basispolycoeffs=keep.map(i=>xyzpolyslist[i].coefflist);

        for(let i=0;i<basisnodes.length;i++){
            console.log(i);
            const basisnode=basisnodes[i];
            const {poly,ops,parentSet}=xyzpolys.get(basisnode);
            console.log("ops ",ops); 
            console.log("poly ",poly.toString());
            console.log(codegenGLSLTyped(new custumStatementNode([basisnode],(code)=>code)));
            console.log("-----------------------------");
        }

        return {basisnodes,basispolys,basispolycoeffs,monomialkeys};
    }


    static extractmonomM(root){

        const cache=new Map();
        const handletonode=new Map();
        let handleid=0;

        function newhandle(node){
            const h=`node[${handleid++}]`;
            handletonode.set(h,node);
            return h;
        }

        const rowmaps = root.parents.map(bladenode=>{
            const rowpoly=bladenode.visitnodesrec((node,parentResults)=>{

                const dependsonxyz =
                    parentResults.some(x => x.dependsonxyz) ||
                    (node instanceof VarNode && node.isxyz());

                let poly;
                if(node instanceof VarNode && node.isxyz())
                    poly=Poly.var(node.varname);
                else if(node instanceof ConstNode)
                    poly=Poly.constant(node.value);
                else if(!dependsonxyz)
                    poly=Poly.var(newhandle(node));
                else
                    poly=matrixextractor2.applyoptopolys(node,parentResults.map(p=>p.poly));

                return {poly,dependsonxyz};

            },cache).poly;

            const rowmapofsums=new Map();

            for (const [monom, coeff] of rowpoly.entries()) {

                let nodeprod=[];
                let xyzmonom={};

                if(coeff!=1) nodeprod.push(new ConstNode(coeff));

                for(const [varname,exponent] of Object.entries(monom)){
                    if(varname.startsWith("node"))
                        nodeprod.push(powNode(handletonode.get(varname),exponent));
                    else
                        xyzmonom[varname]=exponent;
                }

                const key=Poly.monomialToKey(xyzmonom);

                if(!rowmapofsums.has(key)) rowmapofsums.set(key,[]);
                rowmapofsums.get(key).push(MulNode.of(...nodeprod));
            }

            return new Map(
                rowmapofsums.entries().map(([k,v])=>[k,AddNode.of(...v)])
            );
        });


        // -----------------------------
        // collect monomial basis
        // -----------------------------

        const basiskmap=new Map();

        for(const rowmap of rowmaps){
            for(const key of rowmap.keys()){
                if(!basiskmap.has(key)){
                    basiskmap.set(key,new Poly(new Map([[key,1]])));
                }
            }
        }



        const monomialkeys=[...basiskmap.keys()].sort((a,b)=>{
            const da=basiskmap.get(a).degree();
            const db=basiskmap.get(b).degree();
            return db-da;
        });

        const basispolys=monomialkeys.map(k=>basiskmap.get(k));

        // -----------------------------
        // build DAG nodes for basis
        // -----------------------------

        function monomToNode(monom){
            const factors=[];
            for(const [v,e] of Object.entries(monom)){
                factors.push(powNode(new VarNode(v),e));
            }
            return MulNode.of(...factors);
        }

        const basisnodes=basispolys.map(p=>{
            const [[monom,_]]=[...p.entries()];
            return monomToNode(monom);
        });

        const basis=new BundlenodeNode(basisnodes);

        // -----------------------------
        // build matrix
        // -----------------------------

        const matrix=rowmaps.map(rowmap =>
            monomialkeys.map(k => rowmap.get(k) ?? ConstNode.zero)
        );

        return {basis,matrix,basispolys,monomialkeys};
    }

    static ultimateSolution(root){
        const emptyresult={
            basis: new BundlenodeNode([ConstNode.zero]),
            basispolys: [Poly.constant(0)],
            matrix: [[ConstNode.zero]]
        };
        const matempty=(m)=>m.length==0 || m[0].length==0;

        if(root.parents.length==0)return emptyresult;
        const {matrix,monomialkeys}=matrixextractor2.extractmonomM(root);
        if(matempty(matrix))return emptyresult;
        const {basisnodes,basispolys}=matrixextractor2.extractBasisMSG(root,monomialkeys);
        
        const coefflist=basispolys.map(p=>monomialkeys.map(monomkey=>p.coeffs.get(monomkey)??0));//rebuld in correct order

        const basisswitchmat=mathjs.transpose(mathjs.pinv( mathjs.transpose(coefflist)));


        const transformedmat=matrixextractor2.matmulNodes(matrix,basisswitchmat);

        return {basis:new BundlenodeNode(basisnodes),basispolys,matrix:transformedmat};
    }

    static matmulNodes(A, B) {//by chatgpt
        const rows = A.length;
        const k = A[0].length;
        const cols = B[0].length;

        const C = Array.from({length: rows}, () => Array(cols));

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {

                const terms = [];

                for (let t = 0; t < k; t++) {
                    const a = A[i][t];
                    const b = B[t][j];

                    if (b === 0) continue;

                    const coeff = new ConstNode(b);
                    terms.push(MulNode.of(coeff, a));
                }

                C[i][j] = AddNode.of(...terms);
            }
        }

        return C;
    }


}



export class evalContext {
    constructor() {
        this.variables = new Map();
        this.nodecache = new Map();
        this.paramsversion = 0;
    }
    static RESERVED_PARAMS = ["_V_X", "_V_Y", "_V_Z"];

    /**
     * Registers a list of parameter names. Reserved names are rejected by default.
     * 
     * @param {Iterable<string>} newParams - Parameter names to register.
     * @param {Object} [options] - Optional settings.
     * @param {boolean} [options.ignoreReserved=false] - If true, reserved names are silently skipped.
     * @throws Will throw an error if a reserved name is encountered and not ignored.
     */
    registerParams(newParams, { ignoreReserved = false } = {}) {
        for (const p of newParams) {
            if (evalContext.RESERVED_PARAMS.includes(p)) {
                if (!ignoreReserved)
                    throw new Error(`Cannot register reserved parameter: ${p}`);
                continue;
            }
            if (!this.variables.has(p))
                this.variables.set(p, 0);
        }
    }

    /**
     * Merges new parameter values into the current parameter set.
     * Only registered parameters may be changed.
     * Reserved parameters are always rejected.
     * 
     * @param {Map<string, number>} newParams - Map of parameter names and new values.
     * @throws Will throw if any key is unregistered or reserved.
     */
    paramsChanged(newParams = new Map()) {
        let changed = false;
        for (const [k, v] of newParams) {
            if (evalContext.RESERVED_PARAMS.includes(k))
                throw new Error(`Cannot change reserved parameter: ${k}`);
            if (!this.variables.has(k))
                throw new Error(`Unregistered parameter: ${k}`);
            if (this.variables.get(k) !== v) {
                changed = true;
                this.variables.set(k, v);
            }
        }
        if (changed) this.clear();
    }

    clear(){
        this.nodecache.clear();
        this.paramsversion = (this.paramsversion + 1) % Number.MAX_SAFE_INTEGER;//the modulo is useless because it wont overflow for years if you call this thousends of times per seccond
    }

    /**
     * Evaluates a given node using the current variables and cached results.
     *
     * @param {Node} node - The node to evaluate.
     * @returns {*} The computed value of the node.
     */
    eval(node) {
        return node.eval(this.variables, this.nodecache);
    }

    

}


/**
 * Docstring by chatgpt
 * Modified Gram-Schmidt process for extracting a linearly independent set of vectors.
 * 
 * @param {Array<Array<number>>} S - Input array of vectors (each vector is an array of numbers).
 * @param {number} [tol=1e-10] - Tolerance for detecting linear dependence. Vectors with residual
 *                               norm <= tol are considered dependent and rejected.
 * @param {boolean} [reltol=true] - If true, tolerance is relative to the vector norm (scale-invariant).
 *                                  If false, absolute tolerance is used.
 * 
 * @returns {Object} An object containing:
 *   - E: Array of orthonormal vectors (arrays of numbers) forming the independent set.
 *   - keep: Array of indices of input vectors in S that were kept as independent.
 * 
 * @example
 * const S = [[1,0,0],[1,1,0],[2,0,0]];
 * const {E, keep} = MSG(S);
 * // E contains orthonormal basis vectors
 * // keep contains indices of independent vectors from S
 */
function MSG(S,tol=1e-9,reltol=true){
    //https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process#Algorithm
    //https://dkenefake.github.io/blog/Orthoginalization
    const len=(v)=>Math.sqrt(v.reduce((prev,x)=>prev+x*x,0));
    //const scale=(v,s)=>v.map(x=>x*s);
    //const normalize=(v)=>scale(v,1/len(v));
    const dot=(u,v)=>u.reduce((prev,ui,i)=>prev+ui*v[i],0);
    //const sub=(u,v)=>u.map((ui,i)=>ui-v[i]);
    //S=S.map(normalize);
    const keep=[];
    const E=[];
    for(let i=0;i<S.length;i++){
        const r=S[i].slice();
        for(const e of E){
            //r=sub(r,scale(e,dot(r,e)));
            const d=dot(r,e); 
            for(let j=0;j<r.length;j++)r[j]-=e[j]*d;
        }
        const l=len(r);
        if(l>tol*(reltol?len(S[i]):1)){
            keep.push(i);
            //E.push(normalize(r));
            //E.push(scale(r,1/l));//lets make it fast why not
            for(let j=0;j<r.length;j++)r[j]/=l;
            E.push(r);
        }
    }
    return {E,keep};
}