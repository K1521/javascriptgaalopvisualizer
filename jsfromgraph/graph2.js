export class GraphNode {
    constructor(operand,parents=[]) {
        if(operand === undefined)
            throw new Error("operand is undefined");
        if(parents === undefined)
            throw new Error("parents is undefined");
        this.parents = parents;
        this.operand = operand;
    }
}





class Operand {
    eval(parentsvalues) {
        throw new Error("eval method not implemented");
    }

    stringify(parentstrings) {
        throw new Error("stringify method not implemented");
    }

    
}





    

export class AddOperand extends Operand {
    eval(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc + val, 0);
    }
    stringify(parentstrings) {
        return "("+parentstrings.join("+")+")";
    }
    static instance = new AddOperand();
}

export class MulOperand extends Operand {
    eval(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc * val, 1);
    }
    stringify(parentstrings) {
        return "("+parentstrings.join("*")+")";
    }
    static instance = new MulOperand();
}

export class SubOperand extends Operand {
    eval(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc - val);
    }
    stringify(parentstrings) {
        return "("+parentstrings.join("-")+")";
    }
    static instance = new SubOperand();
}

export class DivOperand extends Operand {
    eval(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc / val);
    }
    stringify(parentstrings) {
        return "("+parentstrings.join("/")+")";
    }
    static instance = new DivOperand();
}

export class ConstOperand extends Operand {
    constructor(value) {
        super();
        this.value = value;
    }

    eval(parentsvalues) {
        return this.value;
    }
    stringify(parentstrings) {
        return this.value.toString();
    }

}

export class VarOperand extends Operand {
    constructor(name) {
        super();
        this.name = name;
    }
    stringify(parentstrings) {
        return this.name;
    }

}

class UnaryOperand extends Operand {
    constructor(fun) {
        super();
        this.fun=fun;
    }
    eval(parentsvalues) {
        return this.fun(parentsvalues[0]);
    }

}

export class NegOperand extends UnaryOperand {
    constructor() {
        super((x) => -x);
    }
    stringify(parentstrings) {
        return "(-"+parentstrings[0]+")";
    }
    static instance = new NegOperand();
}

export class AbsOperand extends UnaryOperand {
    constructor() {
        super((x) => Math.abs(x));
    }
    stringify(parentstrings) {
        return "abs("+parentstrings[0]+")";
    }
    static instance = new AbsOperand();
}

export class SqrtOperand extends UnaryOperand {
    constructor() {
        super((x) => Math.sqrt(x));
    }
    stringify(parentstrings) {
        return "sqrt("+parentstrings[0]+")";
    }
    static instance = new SqrtOperand();

}

function evaluatenode(node,evaluationcash=new Map()) {
    if (evaluationcash.has(node)) {
        return evaluationcash.get(node);
    }
    if (node.operand instanceof VarOperand) {
        throw new Error(`Variable ${node.operand.name} not found in evaluation cache`);
    }
    const parentsvalues = node.parents.map((parent) => evaluatenode(parent,evaluationcash));
    const result = node.operand.eval(parentsvalues);
    evaluationcash.set(node, result);
    return result;
}

//alternative implementation of evaluatenode that uses visitnodes to evaluate the graph in topological order
//i think this has more overhead but is more consistent with other code
function evaluatenodes(nodes, evaluationcash = new Map()) {
    visitnodes(nodes, (node, parentresults) => {
        if (node.operand instanceof VarOperand) {
            const varname=node.operand.name;
            if(evaluationcash.has(varname))return evaluationcash.get(varname);
            throw new Error(`Variable ${node.name} not found in evaluation cache`);
        }
        return node.operand.eval(parentresults);
    }, evaluationcash);
    if (nodes instanceof GraphNode) {
        return evaluationcash.get(nodes);
    } else if (nodes instanceof Array) {
        return Array.from(nodes.map((node) => evaluationcash.get(node)));
    } else {
        throw new Error("nodes must be a GraphNode or an array of GraphNodes");
    }
}

/*
var x=new VarNode("x");
var y=new VarNode("y");
var a=new AddNode([x,y]);
var b=new MulNode([x,y]);
var c=new SubNode([a,b]);
console.log(evaluatenode(c,new Map([[x,2],[y,3]]))); // 2+3-2*3=2+3-6=-1
*/

class Multivector {
    constructor() {
        //this is basically a sparse array where the index is the blade index
        this._values = new Map();
        //this.name = name;
    }

    /* @param {number} index - The index of the blade.
     * @param {T} value - The value to set at the specified index.
     */
    set(index, value) {
        this._values.set(index, value);
    }

    /* @param {number} index - The index of the blade.
     * @returns {T} The value at the specified index.
     */
    get(index) {
        return this._values.get(index);
    }

    /**
     * Maps the values of the multivector to a new multivector using the provided function.
     * 
     * @template T, U
     * @param {(value: T, index: number) => U} func - A function that takes a value and its index, and returns a transformed value.
     * @returns {Multivector<U>} - A new multivector with the values transformed by the function.
     */
    map(func) {
        const newMultivector = new Multivector();
        for (const [index, value] of this.entries()) {
            newMultivector.set(index, func(value, index));
        }
        return newMultivector;
    }

    /**
     * @returns {IterableIterator<[number, T]>} - An iterator over the entries of the multivector.
     */

    entries() {
        return this._values.entries();
    }

    /**
     * 
     * @returns {IterableIterator<T>} - An iterator over the values of the multivector.
    */

    values() {  
        return this._values.values();
    }

    /**
     * @returns {IterableIterator<number>} - An iterator over the indices of the multivector.
    */
    keys() {
        return this._values.keys();
    }

    /**
     * @returns {number} - The size of the multivector.
    */

    size() {
        return this._values.size;
    }
}




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



    fromjson(jsonstring){
        const json=JSON.parse(jsonstring);
        this.name=json.name;
    
        const Multivectors=new Map(); // name -> Multivector of nodes
        const scalars=new Map(); // name -> node
    
        for(const [index, inputScalar] of json.inputScalars.entries()){
            const node=new GraphNode(new VarOperand(inputScalar));
            this.inputScalars.set(inputScalar, node);
            scalars.set(inputScalar, node);
            scalars.set("inputsVector["+index+"]", node);//gapp behaves weirdly and uses inputsVector[index] instead of name
        }
    
        for (const renderingExpression of json.renderingExpressions) {
            const name = renderingExpression.name;
            const expression = renderingExpression.expression;
            this.renderingExpression.set(name, expression);
        }
        //const inputsVector = json.inputScalars;
    
    
        function parseExpression(node) {
            if (node.type === "Mul") {
                const left = parseExpression(node.left);
                const right = parseExpression(node.right);
                return new GraphNode( MulOperand.instance,[left, right]);
            } else if (node.type === "Add") {
                const left = parseExpression(node.left);
                const right = parseExpression(node.right);
                return new GraphNode( AddOperand.instance,[left, right]);
            } else if (node.type === "Sub") {
                const left = parseExpression(node.left);
                const right = parseExpression(node.right);
                return new GraphNode( SubOperand.instance,[left, right]);
            } else if (node.type === "Div") {
                const left = parseExpression(node.left);
                const right = parseExpression(node.right);
                return new GraphNode( DivOperand.instance,[left, right]);
            } else if (node.type === "Const") {
                return new GraphNode(new ConstOperand(node.value));
            } else if (node.type === "Negation") {
                return  new GraphNode(NegOperand.instance,[parseExpression(node.operand)]);
            } else if (node.type === "MathFunctionCall") {
                const func = node.function;
                const operand = parseExpression(node.operand);
                if (func === "abs") {
                    return new GraphNode(AbsOperand.instance,[operand]);
                } else if (func === "sqrt") {
                    return new GraphNode(SqrtOperand.instance,[operand]);
                } else {
                    throw new Error(`Unknown function: ${func}`);
                }
            }
            
            else if (node.type === "MultivectorVariable") {
                //TODO bladindex should be integer. how do i cast it to int?
                if (node.name.startsWith("inputsVector[") && node.name.endsWith("]")) {
                   return scalars.get(node.name);// Return the corresponding input vector
                }
    
                return Multivectors.get(node.name).get(node.bladeIndex);
            } else if (node.type === "Variable") {
                return scalars.get(node.name);
            } else {
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
                        Multivectors.set(name,new Multivector());
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
                this.objectcolormap.set(node.expression.name,activeColor);
            } else {
                throw new Error(`Unknown node type: ${node.type}`);
            }
            
        }
    
        for (const name of json.outputMultivectors) {
            this.outputMultivectors.set(name, Multivectors.get(name));
        }

        this.allMultivectors=Multivectors;
    
    }

    
    /**
     * 
     * @returns {VisualisationGraph[]} list of visualisation graphs
     */
    createVisualisationgraphs1() {

        const VisualisationGraphs=[];
        const xyz=[..."XYZ"].map((cord)=>this.inputScalars.get("_V_"+cord));
        const inputnodes=new Map(xyz.map((node)=>[node,node]));
        for (const [innerProductResultName,outputMultivectorName] of this.renderingExpression.entries()) {
        const innerProductResult=this.outputMultivectors.get(innerProductResultName);
        const innerProductInput=this.outputMultivectors.get(outputMultivectorName);
        const newinnerProductInput=new Multivector();


        let args=0;
        for (const [index, value] of innerProductInput.entries()) {
            const node = new GraphNode(new VarOperand("args["+(args++)+"]"));
            newinnerProductInput.set(index, node);
            inputnodes.set(value, node);
        }
        const outputnodes=subgraph(inputnodes,innerProductResult.values());


        const newinnerProductResult=innerProductResult.map((value) => outputnodes.get(value));
        /*for (const [index, value] of innerProductResult.values.entries()) {
            newinnerProductResult.set(index, outputnodes.get(value));
        }*/
        //this code creates a input variable for each blade of the multivector to visualize (newinnerProductInput)
        //and a new multivector for each output node (newinnerProductResult)
        VisualisationGraphs.push(new VisualisationGraph(newinnerProductInput, newinnerProductResult,innerProductInput,outputMultivectorName));
        }
        return VisualisationGraphs;
    }

    createVisualisationgraphs2(){
        const VisualisationGraphs=[];
        for (const [innerProductResultName,outputMultivectorName] of this.renderingExpression.entries()) {
            const innerProductResultNodes=arrayify(this.outputMultivectors.get(innerProductResultName).values());

            VisualisationGraphs.push(new VisualisationGraph2(innerProductResultNodes,outputMultivectorName));
        }
        return VisualisationGraphs;
    }

    
}
    


//var path="G:\\Users\\konst\\data\\gaalop\\input\\jsonexport.json";

/*var fs = require('fs');
fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }

    const graph=new GaalopGraph();
    graph.fromjson(data);
    console.log(graph);


    //graphtocode( Array.from(graph.outputMultivectors.values().flatMap((multivector) => Array.from(multivector.values()))));

    let graphoutputnodes=Array.from(graph.outputMultivectors.values().flatMap((multivector) => Array.from(multivector.values())));
    outputnodes=[...commonsubexpressionelimination(graphoutputnodes).values()];
    //graphtocode(outputnodes);

    const visualisationgraphs=graph.createVisualisationgraphs2(graph);
    //graphtocode(Array.from(visualisationgraphs[0].GPUresult.values()));

    fs.readFile("./jsfromgraph/frag_aberth_generated.glsl", 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(visualisationgraphs[0].gencodeaberth(data));
    });
    //console.log(visualisationgraphs);
});*/



/*async function load(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("couldnt load "+url);
    }
    return await response.text();
  }*/



export function topologicalsort(outputnodes){
    //todo check for cycles
    const visited = new Set();
    const stack = [];

    function visit(node) {
        if (visited.has(node))return;
        visited.add(node);
        for (const parent of node.parents) {
            visit(parent);
        }
        stack.push(node);
    }
    
    if(outputnodes instanceof GraphNode) { 
        visit(outputnodes); 
    }else if (outputnodes instanceof Array) {
        for (const node of outputnodes) {
            visit(node);
        }
    } else {
        throw new Error("outputnodes must be a GraphNode or an array of GraphNodes");
    }

    return stack;
}


export class GraphToCode{


    computeassignmentnodes(outputnodes) {
        
    
        //outputnodes :name->node
        const topsort=topologicalsort(outputnodes);
    
        var assignmentnodes=new Set();
        //var inputnodes=new Set();
    
        
        //all nodes with more than one child are assignment nodes so their values can be reused
        const numberofchildren=new Map();
        for (const node of topsort) {
            numberofchildren.set(node,0);
        }
        for (const node of topsort) {
            for (const parent of node.parents) {
                numberofchildren.set(parent,numberofchildren.get(parent)+1);
            }
        }
        for (const node of topsort) {
            if (numberofchildren.get(node)>1) {
                assignmentnodes.add(node);
            }
        }

        //all output nodes are assignment nodes
        for (const node of outputnodes) {
            assignmentnodes.add(node);
        }

        //Variable nodes dont need to be assigned a name
        for (const node of topsort) {
            if (node.operand instanceof VarOperand) {
                //inputnodes.add(node);
                assignmentnodes.delete(node);
            }
        }

        if(this.inlineconstants){
            for (const node of topsort) {
                if (node.operand instanceof ConstOperand) {
                    assignmentnodes.delete(node);
                }
            }
        }
        return assignmentnodes;
    }

    

    emitbody() {
        let nodecounter=0;
        visitnodes(this.outputnodes,
            (node,parentresults)=>{
                const nodestring=this.stringifnode(node,parentresults);
                if(this.assignmentnodes.has(node)){
                    //make up name for node
                    const name = `_node${nodecounter++}`;
                    this.code+=this.stringifyassignment(name,nodestring,node);
                    return name;
                } else {
                    return nodestring;
                }
            },
            this.noderepresentationcashe
        )
    }

    generatecodeinternal(outputnodes){
        //this sets up some internal state for the code generation
        this.outputnodes=arrayify(outputnodes);
        console.log(this.outputnodes.length);
        this.code = "";
        this.noderepresentationcashe=new Map(); //node->string
        this.assignmentnodes=this.computeassignmentnodes(this.outputnodes); //node->string

        //this generates the code for the function
        this.emitheader();
        this.emitbody();
        //const returnvalues=new Map(this.outputnodes.map((node) => [node,this.noderepresentationcashe.get(node)]));
        //console.log(returnvalues.size());
        this.emitfooter(this.outputnodes,this.outputnodes.map((node) => this.noderepresentationcashe.get(node)));
        return this.code;
    }


    constructor(inlineconstants=true) {
        this.inlineconstants=inlineconstants;
    }

    

    stringifyassignment(name,nodestring,node) {
        return `    ${name} = ${nodestring};\n`;    
    }
    stringifnode(node,parentresults) {
        if(node.operand instanceof VarOperand) {
            return "args."+node.operand.name;
        }
        return node.operand.stringify(parentresults);
    }

    emitheader() {
       this.code+=`function ${this.functionname}(args) {\n`;
    }

    /**
     * 
     * param {Map<GraphNode,String>} returnvalues - A map of output nodes to their string representations. 
     * @param {GraphNode[]} nodes -this are the outputnodes generateinternal is called with
     * @param {String[]} nodenstrings -string for the nodes
     * 
     */

    emitfooter(nodes,nodenstrings) {
        this.code+= `return [${nodenstrings.join(",")}];\n}\n`;
    }

    generate(outputnodes,functionname) {
        this.functionname = functionname;
        return this.generatecodeinternal(outputnodes);
    }
}

class GraphToCodeGLSLVis_simple extends GraphToCode {
    constructor() {
        super(false);
    }

    emitheader() {
       

        /*
        DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){
    DualComplex x=DualComplex(ComplexMul(Complex(rayDir.x,0.),a)+Complex(rayOrigin.x,0.),rayDir.x,0.);
    DualComplex y=DualComplex(ComplexMul(Complex(rayDir.y,0.),a)+Complex(rayOrigin.y,0.),rayDir.y,0.);
    DualComplex z=DualComplex(ComplexMul(Complex(rayDir.z,0.),a)+Complex(rayOrigin.z,0.),rayDir.z,0.);
    */
        this.code+=`float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a) {\n`;
        this.code+=`    float _V_X=rayDir.x*a+rayOrigin.x;\n`;
        this.code+=`    float _V_Y=rayDir.y*a+rayOrigin.y;\n`;
        this.code+=`    float _V_Z=rayDir.z*a+rayOrigin.z;\n`;
        

    }

    generate(outputnode) {
        
       
        let glslfunction= this.generatecodeinternal([outputnode]);
        return glslfunction;
        

       
    }

    emitfooter(nodes,nodenstrings) {
        this.code+= `    return ${nodenstrings[0]};\n}\n`;
    }

    stringifyassignment(name,nodestring,node) {

        return `    float ${name} = ${nodestring};\n`;    
    }

    stringifnode(node,parentresults) {
        if(node.operand instanceof MulOperand) {
            if(node.parents.length!==2) throw new Error("MulOperand must have 2 parents");
            let [leftparent,rightparent]=parentresults;
            return `(${leftparent}*${rightparent})`
        }
        if(node.operand instanceof DivOperand) {
            if(node.parents.length!==2) throw new Error("DivOperand must have 2 parents");
            let [leftparent,rightparent]=parentresults;
            return `(${leftparent}/${rightparent})`
        }
        if(node.operand instanceof AddOperand) {
            if(node.parents.length!==2) throw new Error("AddOperand must have 2 parents");
            let [leftparent,rightparent]=parentresults;
           return `(${leftparent}+${rightparent})`;
        }
        if(node.operand instanceof ConstOperand){
            const s = node.operand.value.toString();
            if (s.includes('.') || s.includes('e') || s.includes('E')) return s;
            return s + '.0'; 
        }
        return node.operand.stringify(parentresults);
    }
}


class GraphToCodeGLSLVis_aberth_ComplexDual_old extends GraphToCode {
    constructor() {
        super(false);
        //this.template=template;
    }

    emitheader() {
       

        /*
        DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){
    DualComplex x=DualComplex(ComplexMul(Complex(rayDir.x,0.),a)+Complex(rayOrigin.x,0.),rayDir.x,0.);
    DualComplex y=DualComplex(ComplexMul(Complex(rayDir.y,0.),a)+Complex(rayOrigin.y,0.),rayDir.y,0.);
    DualComplex z=DualComplex(ComplexMul(Complex(rayDir.z,0.),a)+Complex(rayOrigin.z,0.),rayDir.z,0.);
    */
        this.code+=`DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a) {\n`;
        this.code+=`    DualComplex _V_X=DualComplex(ComplexMul(Complex(rayDir.x,0.),a)+Complex(rayOrigin.x,0.),rayDir.x,0.);\n`;
        this.code+=`    DualComplex _V_Y=DualComplex(ComplexMul(Complex(rayDir.y,0.),a)+Complex(rayOrigin.y,0.),rayDir.y,0.);\n`;
        this.code+=`    DualComplex _V_Z=DualComplex(ComplexMul(Complex(rayDir.z,0.),a)+Complex(rayOrigin.z,0.),rayDir.z,0.);\n`;
        

    }

    generate(outputnode) {
        
        this.typemap=new Map(); //node->type
        visitnodes(outputnode, (node, parentresults) => {
            if(node.operand instanceof VarOperand) {
                if(node.operand.name.startsWith("args")) {
                    return "float";
                }else {
                    return "DualComplex";
                }
            } 
            if(node.operand instanceof ConstOperand)return "float";
            if(node.operand instanceof NegOperand)return parentresults[0];
            if(node.operand instanceof MulOperand || node.operand instanceof DivOperand || node.operand instanceof AddOperand) { 
                if(node.parents.length!==2) throw new Error(`${node.operand.constructor.name} must have 2 parents`);
                const left=parentresults[0];
                const right=parentresults[1];
                if(left === "float" && right === "float") return "float";
                return "DualComplex";
            }
            throw new Error();
            


        },this.typemap);




        let glslfunction= this.generatecodeinternal([outputnode]);
        return glslfunction;
    }

    emitfooter(nodes,nodenstrings) {
        this.code+= `    return ${nodenstrings[0]};\n}\n`;
    }

    stringifyassignment(name,nodestring,node) {

        return `    ${this.typemap.get(node)} ${name} = ${nodestring};\n`;    
    }

    stringifnode(node,parentresults) {
        if(node.operand instanceof MulOperand) {
            if(node.parents.length!==2) throw new Error("MulOperand must have 2 parents");
            const [left,right]=node.parents;
            let [leftparent,rightparent]=parentresults;
            if(this.typemap.get(left)==="float" || this.typemap.get(right)==="float") return `(${leftparent}*${rightparent})`

            if(left === right)
                return `DualComplexSqare(${leftparent})`;
            return `DualComplexMul(${leftparent},${rightparent})`;
        }
        if(node.operand instanceof DivOperand) {
            if(node.parents.length!==2) throw new Error("DivOperand must have 2 parents");
            const [left,right]=node.parents;
            let [leftparent,rightparent]=parentresults;
            if(this.typemap.get(right)==="float") return `(${leftparent}/${rightparent})`
            if(this.typemap.get(left)==="float") leftparent=`DualComplex(${leftparent},0.,0.,0.)`;
            return `DualComplexDiv(${leftparent},${rightparent})`;
        }
        if(node.operand instanceof AddOperand) {
            if(node.parents.length!==2) throw new Error("AddOperand must have 2 parents");
            const [left,right]=node.parents;
            let [leftparent,rightparent]=parentresults;
            if(this.typemap.get(left)==="float" && this.typemap.get(right)==="float") return `(${leftparent}+${rightparent})`;
            if(this.typemap.get(left)==="float") leftparent=`DualComplex(${leftparent},0.,0.,0.)`;
            if(this.typemap.get(right)==="float") rightparent=`DualComplex(${rightparent},0.,0.,0.)`;
            return `(${leftparent}+${rightparent})`;
        }
        if(node.operand instanceof ConstOperand){
            const s = node.operand.value.toString();
            if (s.includes('.') || s.includes('e') || s.includes('E')) return s;
            return s + '.0'; 
        }
        return node.operand.stringify(parentresults);
    }
}


class GraphToCodeGLSLVis_abstract_Dual extends GraphToCode {
    constructor(dualtype) {
        super(false);
        //this.template=template;
        this.dualtype=dualtype;
    }

    emitheader() {
       

        /*
        DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){
    DualComplex x=DualComplex(ComplexMul(Complex(rayDir.x,0.),a)+Complex(rayOrigin.x,0.),rayDir.x,0.);
    DualComplex y=DualComplex(ComplexMul(Complex(rayDir.y,0.),a)+Complex(rayOrigin.y,0.),rayDir.y,0.);
    DualComplex z=DualComplex(ComplexMul(Complex(rayDir.z,0.),a)+Complex(rayOrigin.z,0.),rayDir.z,0.);
    */
    throw Error("this method is abstract");
        

    }

    generate(outputnode) {
        
        this.typemap=new Map(); //node->type
        visitnodes(outputnode, (node, parentresults) => {
            if(node.operand instanceof VarOperand) {
                if(node.operand.name.startsWith("args")) {
                    return "float";
                }else if(node.operand.name.startsWith("_V_")) {
                    return this.dualtype;
                } else {
                    throw new Error("unknown variable");
                }
            } 
            if(node.operand instanceof ConstOperand)return "float";
            if(node.operand instanceof NegOperand)return parentresults[0];
            if(node.operand instanceof MulOperand || node.operand instanceof DivOperand || node.operand instanceof AddOperand) { 
                if(node.parents.length!==2) throw new Error(`${node.operand.constructor.name} must have 2 parents`);
                const left=parentresults[0];
                const right=parentresults[1];
                if(left === "float" && right === "float") return "float";
                return this.dualtype;
            }
            throw new Error();
            


        },this.typemap);




        let glslfunction= this.generatecodeinternal([outputnode]);
        return glslfunction;
    }

    emitfooter(nodes,nodenstrings) {
        this.code+= `    return ${nodenstrings[0]};\n}\n`;
    }

    stringifyassignment(name,nodestring,node) {

        return `    ${this.typemap.get(node)} ${name} = ${nodestring};\n`;    
    }

    dualmul(left,right){
        throw Error("this method is abstract");
    }

    dualdiv(left,right){
        throw Error("this method is abstract");
    }


    dualCast(parentstring){
        throw Error("this method is abstract");
    }





    stringifnode(node,parentresults) {
        if(node.operand instanceof MulOperand) {
            if(node.parents.length!==2) throw new Error("MulOperand must have 2 parents");
            const [left,right]=node.parents;
            let [leftparent,rightparent]=parentresults;
            if(this.typemap.get(left)==="float" || this.typemap.get(right)==="float") return `(${leftparent}*${rightparent})`

           return this.dualmul(leftparent,rightparent);
        }
        if(node.operand instanceof DivOperand) {
            if(node.parents.length!==2) throw new Error("DivOperand must have 2 parents");
            const [left,right]=node.parents;
            let [leftparent,rightparent]=parentresults;
            if(this.typemap.get(right)==="float") return `(${leftparent}/${rightparent})`
            if(this.typemap.get(left)==="float") leftparent=this.dualCast(leftparent);
            return this.dualdiv(leftparent,rightparent);
        }
        if(node.operand instanceof AddOperand) {
            if(node.parents.length!==2) throw new Error("AddOperand must have 2 parents");
            const [left,right]=node.parents;
            let [leftparent,rightparent]=parentresults;
            if(this.typemap.get(left)==="float" && this.typemap.get(right)==="float") return `(${leftparent}+${rightparent})`;
            if(this.typemap.get(left)==="float") leftparent=this.dualCast(leftparent);
            if(this.typemap.get(right)==="float") rightparent=this.dualCast(rightparent);
            return `(${leftparent}+${rightparent})`;
        }
        if(node.operand instanceof ConstOperand){
            const s = node.operand.value.toString();
            if (s.includes('.') || s.includes('e') || s.includes('E')) return s;
            return s + '.0'; 
        }
        return node.operand.stringify(parentresults);
    }
}


class GraphToCodeGLSLVis_aberth_ComplexDual extends GraphToCodeGLSLVis_abstract_Dual{
    constructor(){
        super("DualComplex");
    }

    emitheader() {
       

        /*
        DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){
    DualComplex x=DualComplex(ComplexMul(Complex(rayDir.x,0.),a)+Complex(rayOrigin.x,0.),rayDir.x,0.);
    DualComplex y=DualComplex(ComplexMul(Complex(rayDir.y,0.),a)+Complex(rayOrigin.y,0.),rayDir.y,0.);
    DualComplex z=DualComplex(ComplexMul(Complex(rayDir.z,0.),a)+Complex(rayOrigin.z,0.),rayDir.z,0.);
    */
        this.code+=`DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a) {\n`;
        this.code+=`    DualComplex _V_X=DualComplex(ComplexMul(Complex(rayDir.x,0.),a)+Complex(rayOrigin.x,0.),rayDir.x,0.);\n`;
        this.code+=`    DualComplex _V_Y=DualComplex(ComplexMul(Complex(rayDir.y,0.),a)+Complex(rayOrigin.y,0.),rayDir.y,0.);\n`;
        this.code+=`    DualComplex _V_Z=DualComplex(ComplexMul(Complex(rayDir.z,0.),a)+Complex(rayOrigin.z,0.),rayDir.z,0.);\n`;
        

    }


    dualmul(left,right){
        if(left === right)
            return `DualComplexSqare(${left})`;
        return `DualComplexMul(${left},${right})`;
    }

    dualdiv(left,right){
        return `DualComplexDiv(${left},${right})`;
    }


    dualCast(parentstring){
        return `DualComplex(${parentstring},0.,0.,0.)`;
    }


}

class GraphToCodeGLSLVis_xyzDual extends GraphToCodeGLSLVis_abstract_Dual{
    constructor(){
        super("xyzDual");
    }

    emitheader() {
       

        /*
        DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){
    DualComplex x=DualComplex(ComplexMul(Complex(rayDir.x,0.),a)+Complex(rayOrigin.x,0.),rayDir.x,0.);
    DualComplex y=DualComplex(ComplexMul(Complex(rayDir.y,0.),a)+Complex(rayOrigin.y,0.),rayDir.y,0.);
    DualComplex z=DualComplex(ComplexMul(Complex(rayDir.z,0.),a)+Complex(rayOrigin.z,0.),rayDir.z,0.);
    */
        this.code+=`xyzDual xyzDualSummofsquares(vec3 pos) {\n`;
        this.code+=`    xyzDual _V_X=xyzDual(1.,0.,0.,pos.x);\n`;
        this.code+=`    xyzDual _V_Y=xyzDual(0.,1.,0.,pos.y);\n`;
        this.code+=`    xyzDual _V_Z=xyzDual(0.,0.,1.,pos.z);\n`;
        

    }


    dualmul(left,right){
        if(left === right)
            return `xyzDualSqare(${left})`;
        return `xyzDualMul(${left},${right})`;
    }

    dualdiv(left,right){
        return `xyzDualDiv(${left},${right})`;
    }


    dualCast(parentstring){
        return `xyzDual(0.,0.,0.,${parentstring})`;
    }


}

class GraphToCodeGLSLVis_ExtendedDual extends GraphToCodeGLSLVis_abstract_Dual{
    constructor(){
        super("xyzDual");
    }

    emitheader() {
       

        /*
        DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){
    DualComplex x=DualComplex(ComplexMul(Complex(rayDir.x,0.),a)+Complex(rayOrigin.x,0.),rayDir.x,0.);
    DualComplex y=DualComplex(ComplexMul(Complex(rayDir.y,0.),a)+Complex(rayOrigin.y,0.),rayDir.y,0.);
    DualComplex z=DualComplex(ComplexMul(Complex(rayDir.z,0.),a)+Complex(rayOrigin.z,0.),rayDir.z,0.);
    */
        this.code+=`xyzDual xyzDualSummofsquares(vec3 pos) {\n`;
        this.code+=`    xyzDual _V_X=xyzDual(1.,0.,0.,pos.x);\n`;
        this.code+=`    xyzDual _V_Y=xyzDual(0.,1.,0.,pos.y);\n`;
        this.code+=`    xyzDual _V_Z=xyzDual(0.,0.,1.,pos.z);\n`;
        

    }


    dualmul(left,right){
        if(left === right)
            return `xyzDualSqare(${left})`;
        return `xyzDualMul(${left},${right})`;
    }

    dualdiv(left,right){
        return `xyzDualDiv(${left},${right})`;
    }


    dualCast(parentstring){
        return `xyzDual(0.,0.,0.,${parentstring})`;
    }


}

/**
 * 
 * @param {GraphNode[]} nodes 
 * @returns {Map<GraphNode,GraphNode>} - A map of outputnodes to their copy.
 */
function copygraph(nodes) {
    const nodereplacement = new Map(); //node->newnode
    visitnodes(nodes, (node, parentresults) => {
        const newnode = new GraphNode(node.operand, parentresults);
        return newnode;
    }, nodereplacement);
    //return {nodereplacement:nodereplacement, nodes: nodes.map((node) => nodereplacement.get(node))};
    return new Map(nodes.map((node) => [node, nodereplacement.get(node)])); 
}



export function commonsubexpressionelimination(nodes) {
    nodes=arrayify(nodes);
    const nodescopy=copygraph(nodes); //copy the graph to avoid modifying the original graph
    const nodereplacements=commonsubexpressionelimination_inplace(nodescopy.values());
    //nodes->copy
    //copy->subexpressionelim
    return new Map(nodes.map((node) => [node, nodereplacements.get(nodescopy.get(node))])); //this is a map of nodes to their replacements

}


/**
 * Converts an iterable or array into an array.
 * @param {Iterable<T> | T[]} x - The input to convert.
 * @returns {T[]} - The converted array.
 */
function arrayify(x) {
    if (Array.isArray(x)) return x;
    if (x[Symbol.iterator]) return Array.from(x); // any iterable
    throw new TypeError("Value is not iterable");
}

function commonsubexpressionelimination_inplace(nodes) {


    
    const noderepresentationcashe=new Map(); //string->node
    const nodeids=new Map(); //node->integer //this is used to keep the representations short
    let nodeidcounter=0;
    const nodereplacements=new Map(); //node->node

    nodes=arrayify(nodes);

    visitnodes(nodes, (node, parentresults) => {
        node.parents=parentresults;//here we replace the parents of the node with the parents of the replacement node
        //this is done in place because it is easier
        //if we would create a new node, we would have to replace all references to the old node with the new node
        //and this would be a lot of work
    

        //if a node has the same parents and operand as another node, the parentsring is the same
        const parentids = parentresults.map((parent) => nodeids.get(parent));

        //if the operation is assosiative, we can sort the parents to get a unique representation
        if (node.operand instanceof AddOperand || node.operand instanceof MulOperand) {
            parentids.sort((a, b) => a - b);// .sort() would also work but i hope this is faster because it is a number
        }
        const parentstring = node.operand.stringify(parentids);
        
        //so we can replace the node
        if (noderepresentationcashe.has(parentstring)) {
            return noderepresentationcashe.get(parentstring);
        } else {
            noderepresentationcashe.set(parentstring, node);
            nodeids.set(node, new String(nodeidcounter++));

            return node;
        }
    }, nodereplacements);

    return new Map(nodes.map((node)=>[node,nodereplacements.get(node)])); //this is a map of nodes to their replacements
}	


function countnodes(nodes) { 
    let count=0;
    visitnodes(nodes, (node, parentresults) => {
        count++;
    });
    return count;
}



/**
 * @template T
 * @param {GraphNode[] | GraphNode} nodes - The nodes to visit.
 * @param {(node: GraphNode, parentResults: T[], resultCache: Map<GraphNode, T>) => T} visitfunc - The function to call for each node. It should take the node, its parent results, and the result cache as arguments.
 * @param {Map<GraphNode, T>} resultcache - A cache to store the results of the nodes.
 * @returns {Map<GraphNode, T>} - The cache with the results of the nodes.
 *
 * This function visits the nodes in topological order and applies the visitfunc to each node, passing its parent results.
 */
/*function visitnodes(nodes,visitfunc,resultcash=new Map()) {

    const topsort=topologicalsort(nodes);
    
    for (const node of topsort) {
        const parentresults=node.parents.map((parent) => resultcash.get(parent));
        resultcash.set(node,visitfunc(node,parentresults,resultcash));
    }
    return resultcash;
}*/
export function visitnodes(nodes,visitfunc,resultcache=new Map()) {

    function visit(node) {

        if (resultcache.has(node)) return resultcache.get(node);
        const parentresults = node.parents.map((parent) => visit(parent));
        const result = visitfunc(node, parentresults, resultcache);
        resultcache.set(node, result);
        return result;
    }

    if (nodes instanceof GraphNode) {
        visit(nodes);
    } else if (typeof nodes === "object" && Symbol.iterator in nodes) {
        for (const node of nodes) {
            visit(node);
        }
    } else throw new Error("nodes must be a GraphNode or an iterable of GraphNodes");
    return resultcache;
}


//todo: make a node visitor that can be used to traverse the graph and do something with each node


//inputnodes: map :node->variable node or string
/** 
 * Creates a subgraph by replacing input nodes with their replacements.
 * @param {Map<GraphNode,GraphNode | string>} inputnodes
 * @param {GraphNode[]} outputnodes
 * @returns {Map<GraphNode,GraphNode>} - A map of output nodes to their replacements.
 */
function subgraph(inputnodes, outputnodes) {
    var nodereplacements = new Map();

    outputnodes=Array.from(outputnodes);

    for (const [node, replacement] of inputnodes.entries()) {
        let newReplacement = replacement;
        if (typeof newReplacement === "string") {
            newReplacement = new GraphNode(new VarOperand(newReplacement));
        }
        nodereplacements.set(node, newReplacement);
    }

    visitnodes(outputnodes, (node, parentresults) => {
        return new GraphNode(node.operand, parentresults); //copy the node with its parents and replace the input nodes with their replacements
    }, nodereplacements);


    return new Map(outputnodes.map((node) => [node, nodereplacements.get(node)]));
}





class VisualisationGraph {
    constructor( inputnodes, outputnodes, originalMultivector, originalMultivectorName,argslength) {
        /** @type {string} */
        this.name = originalMultivectorName;

        //this represents the subgraph wich should be computed on the GPU
        /** @type {Multivector<GraphNode>} 
         * @description The input nodes of the graph. These are the Variable nodes that are used as input for the GPU computation. 
        */
        this.GPUargs = inputnodes;


        /** 
         * @type {Multivector<GraphNode>} 
         * @description The output nodes of the graph. These are the nodes that are used as output for the GPU computation.
        */
        this.GPUresult = outputnodes;
        this.sumofSquares = undefined;
        if (this.GPUresult.size() === 0) {
            throw new Error("GPUresult is empty");
        } else if (this.GPUresult.size() === 1) {
            this.sumofSquares = this.GPUresult.values().next().value;
        } else {
            for (const [index, value] of this.GPUresult.entries()) {
               const square = new GraphNode(MulOperand.instance, [value, value]);
                if (this.sumofSquares === undefined) {
                    this.sumofSquares = square;
                } else {
                    this.sumofSquares = new GraphNode(AddOperand.instance, [this.sumofSquares, square]);
                }
            }
        }




        //the original multivector should be computed on the CPU and then the results should be passed to the GPU
        /** 
         * @type {Multivector<GraphNode>} 
         * @description The original multivector. this multivector holds the output for the CPU graph.
        */
        this.originalMultivector = originalMultivector;

        this.argslength=argslength;

        
        



        
    }

    evaluateCPUgraph(inputvaluescache) {
        return evaluatenodes(this.GPUargs.values(), inputvaluescache);
    }

    evaluateGPUgraph(inputvaluescache) {
        //TODO implement GPU evaluation
        this.evaluateCPUgraph(inputvaluescache);

        //todo set uniform for each input node in GPU graph
        for(const index of this.GPUargs.keys()){
            const gpunode=this.GPUargs.get(index);
            const cpunode=this.originalMultivector.get(index);

            const cpuresult=inputvaluescache.get(cpunode);

            const gpuname=gpunode.operand.stringify([]); //should be a variable name



            //set uniform for index in GPU graph
            // something loike
        } 
    }

    /**
     * 
     * @param {String} glslcode - the code in which this visualisation node is inlined
     * @returns 
     */

    codegen(glslcode){

        const codetoreplaceargs="uniform float[?] args;";
        const codetoreplacefunction="DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){?}";

        const sumofSquarescode=new GraphToCodeGLSLVis_aberth_ComplexDual().generate([this.sumofSquares]);
        const argscode=`uniform float[${argslength}] args;`;

        return glslcode.replace(codetoreplaceargs,argscode).replace(codetoreplacefunction,sumofSquarescode);





    }


}




function mapValues(map, fun, keepUndefined = true) {
    return new Map(
      Array.from(map.entries()).map(([key, value]) => {
        const transformedValue = fun(value);
        return [
          key, 
          (!keepUndefined && transformedValue === undefined) ? value : transformedValue
        ];
      })
    );
  }


class VisualisationGraph2 {
    constructor(outputnodes,originalMultivectorName) {
        this.name=originalMultivectorName;

        
        let sumofsquares=undefined;
        if (outputnodes.length === 1) {
            sumofsquares=outputnodes[0];
            
            this.issquared=false;
        }else{
            sumofsquares=this.singularoutput(outputnodes);
            this.issquared=true;
        } 
        console.log(originalMultivectorName,outputnodes);
        
        const splitgraphout=this.splitgraph(sumofsquares);
        

        /**@type {Map<GraphNode,GraphNode>} */
        this.cpu_out_to_gpu_in=splitgraphout.cpu_out_to_gpu_in;

        /**@type {GraphNode} */
        this.GPUgraph =splitgraphout.gpu_out;
        

        /**@type {GraphNode} */
        this.completegraph=sumofsquares;

        //todo

        

    }

    map_gpugraph_ip(fun){
        //this.cpu_out_to_gpu_in=new Map( arrayify(this.cpu_out_to_gpu_in.entries()).map((key,value)=>[key,fun(value)]))
        this.cpu_out_to_gpu_in=mapValues(this.cpu_out_to_gpu_in,fun,false);
        this.GPUgraph=fun(this.GPUgraph);
    }

    simplify(){
        const newnodes=commonsubexpressionelimination_inplace([this.GPUgraph])
        this.map_gpugraph_ip((node)=>newnodes.get(node));

    }

    evaluateCPUgraph(inputvaluescache) {
        return evaluatenodes(arrayify(this.cpu_out_to_gpu_in.keys()), inputvaluescache);
    }

    setuniforms(inputvaluescache,shader) {
        this.evaluateCPUgraph(inputvaluescache);
        //console.log(inputvaluescache);
        for(const [cpunode,gpunode]of this.cpu_out_to_gpu_in.entries()){
            const value=inputvaluescache.get(cpunode);

            const gpuname=gpunode.operand.name;
            if(value===undefined)throw new Error("maybe try to set all input values");
            shader.gl.uniform1f(shader.getUniformLocation(gpuname), value);
        }
    }




    gencode(template){
        const argsLength = this.cpu_out_to_gpu_in.size;
    
        template = template.replace(
            "uniform float[?] args;",
            argsLength > 0 ? `uniform float[${argsLength}] args;` : ""//0-length arrays are not allowed
        );
        template = template.replace(
            "DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){?}",
            new GraphToCodeGLSLVis_aberth_ComplexDual().generate(this.GPUgraph)
        );
        template = template.replace(
            "float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a){?}",
            new GraphToCodeGLSLVis_simple().generate(this.GPUgraph)
        );
        template = template.replace(
            "xyzDual xyzDualSummofsquares(vec3 pos) {?}",
            new GraphToCodeGLSLVis_xyzDual().generate(this.GPUgraph)
        );


        const constants={
            "POLYDEGREE":this.calcpolydegree_gpu(),
            "USE_DOUBLEROOTS":this.issquared?1:0
        }

        for(const [name,value] of Object.entries(constants)){
            template = template.replace(
                `${name}=?;`,
                `${name}=${value};`
            );
            template = template.replace(
                `#define ${name} ?`,
                `#define ${name} ${value}`
            );
        }
        /*template = template.replace(
            "POLYDEGREE=?;",
            `POLYDEGREE=${this.calcpolydegree_gpu()};`
        );
        template = template.replace(
            "#define USE_DOUBLEROOTS ?",
            `#define USE_DOUBLEROOTS ${this.issquared?1:0}`
        );*/

        

        return template;
    }

    gencodeAberth(template) {
        //TODO countroots

        const argsLength = this.cpu_out_to_gpu_in.size;
    
        template = template.replace(
            "uniform float[?] args;",
            argsLength > 0 ? `uniform float[${argsLength}] args;` : ""//0-length arrays are not allowed
        );
    
        template = template.replace(
            "DualComplex DualComplexSummofsquares(vec3 rayDir, vec3 rayOrigin,Complex a){?}",
            new GraphToCodeGLSLVis_aberth_ComplexDual().generate(this.GPUgraph)
        );
    
        return template;
    }



  

    gencodeAberthHybrid(template) {
        template = this.gencodeAberth(template);
    
        template = template.replace(
            "float Summofsquares(vec3 rayDir, vec3 rayOrigin,float a){?}",
            new GraphToCodeGLSLVis_simple().generate(this.GPUgraph)
        );
    
        return template;
    }




    gencodexyzDual(template) {
        //TODO countroots

        const argsLength = this.cpu_out_to_gpu_in.size;
    
        template = template.replace(
            "uniform float[?] args;",
            argsLength > 0 ? `uniform float[${argsLength}] args;` : ""//0-length arrays are not allowed
        );
    
        template = template.replace(
            "xyzDual xyzDualSummofsquares(vec3 pos) {?}",
            new GraphToCodeGLSLVis_xyzDual().generate(this.GPUgraph)
        );
    
        return template;
    }



    calcpolydegree_gpu(){
        return visitnodes(this.GPUgraph,(node,parentresults)=>{
            if(node.operand instanceof VarOperand ) 
                if(node.operand.name.startsWith("_V_")) return 1;
                else return 0;
            if(node.operand instanceof AddOperand || node.operand instanceof SubOperand){
                return Math.max(...parentresults);
            }
            if(node.operand instanceof MulOperand){
                return parentresults.reduce((prev,cur)=>prev+cur,0);
            }
            if(node.operand instanceof NegOperand){
                return parentresults[0];
            }
            if(node.operand instanceof ConstOperand){
                return 0;
            }
            if(node.operand instanceof DivOperand){
                return parentresults[0];//only maximal degree
            }
            throw new Error("bad operation :"+node.operand.constructor.name);
        }).get(this.GPUgraph);
    }
    
   

    
    splitgraph(outputnode){
        //compute nodes dependont on _V_X or _V_Y or _V_Z
        const splitnodes=new Set();//these nodes are the gpu inputs which are precomputed on cpu
        visitnodes(outputnode, (node, parentresults) => {
            if (node.operand instanceof VarOperand) {
                if(node.operand.name.startsWith("_V_")){
                    return {dependsonxyz:true,dependsonvariables:false}
                }else{
                    return {dependsonxyz:false,dependsonvariables:true}
                }
            } else{
                const dependsonxyz=parentresults.reduce((a,b)=> a||b.dependsonxyz,false);
                const dependsonvariables=parentresults.reduce((a,b)=> a||b.dependsonvariables,false);

                if(dependsonxyz && dependsonvariables){
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


        let nodecounter=0;
        const nodemap=new Map();//maps CPU splitnodes to GPU inputnodes
        const GPUgraph=visitnodes(outputnode, (node, parentresults) => {
            if(splitnodes.has(node)){
                const variable=new GraphNode(new VarOperand(`args[${nodecounter++}]`));
                nodemap.set(node,variable);
                return variable;
            } else{
                return new GraphNode(node.operand,parentresults);//copy
            }
        }).get(outputnode);

        return {cpu_out_to_gpu_in:nodemap,gpu_out:GPUgraph };

    }

    singularoutput(outputnodes){
        
        if (outputnodes.length === 0) {
            throw new Error("outputnodes is empty");
        } else if (outputnodes.lengt === 1) {
            return outputnodes[0];
        } else {
            let result=undefined;
            for (const value of outputnodes) {
               const square = new GraphNode(MulOperand.instance, [value, value]);
                if (result === undefined) {
                    result = square;
                } else {
                    result = new GraphNode(AddOperand.instance, [result, square]);
                }
            }
            return result;
        }
    }

    

    


}





















//todo complete these clases

class GraphOutputNodes {
    constructor(nodes) {
        this.nodes=nodes;
    }
   
}

class GraphOutputMapping {
    constructor(outputnodesreplacement) {
        this.outputnodesreplacement=outputnodesreplacement;
    }
    /*applyip(othermapping) {
        for (const [key, value] of this.outputnodesreplacement.entries()) {
            this.outputnodesreplacement.set(key, othermapping.get(value));
        }
    }*/
    chain(othermapping){
        return new GraphOutputMapping(new Map(this.outputnodesreplacement.entries().map(([key, value]) => [key, othermapping.get(value)])));
    }
    filterkeys(keys) {
        //keys=arrayify(keys);//iterator is only used once so we dont need to convert it to an array
        return new GraphOutputMapping(new Map(keys.map((key) => [key, this.outputnodesreplacement.get(key)])));
    }

    get(key) {
        return this.outputnodesreplacement.get(key);
    }


}

//todo make powercompare elimination

/*
function constantratioelimination(nodes){

    nodes=arrayify(nodes);





    visitnodes(nodes, (node, parentresults) => {
       
    }, nodereplacements);


}*/