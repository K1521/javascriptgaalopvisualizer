class GraphNode {
    constructor(operand,parents=[]) {
        if(operand === undefined)
            throw new Error("operand is undefined");
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





    

class AddOperand extends Operand {
    eval(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc + val, 0);
    }
    stringify(parentstrings) {
        return "("+parentstrings.join("+")+")";
    }
    static instance = new AddOperand();
}

class MulOperand extends Operand {
    eval(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc * val, 1);
    }
    stringify(parentstrings) {
        return "("+parentstrings.join("*")+")";
    }
    static instance = new MulOperand();
}

class SubOperand extends Operand {
    eval(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc - val);
    }
    stringify(parentstrings) {
        return "("+parentstrings.join("-")+")";
    }
    static instance = new SubOperand();
}

class DivOperand extends Operand {
    eval(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc / val);
    }
    stringify(parentstrings) {
        return "("+parentstrings.join("/")+")";
    }
    static instance = new DivOperand();
}

class ConstOperand extends Operand {
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

class VarOperand extends Operand {
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

class NegOperand extends UnaryOperand {
    constructor() {
        super((x) => -x);
    }
    stringify(parentstrings) {
        return "(-"+parentstrings[0]+")";
    }
    static instance = new NegOperand();
}

class AbsOperand extends UnaryOperand {
    constructor() {
        super((x) => Math.abs(x));
    }
    stringify(parentstrings) {
        return "abs("+parentstrings[0]+")";
    }
    static instance = new AbsOperand();
}

class SqrtOperand extends UnaryOperand {
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
        throw new Error(`Variable ${node.name} not found in evaluation cache`);
    }
    const parentsvalues = node.parents.map((parent) => evaluatenode(parent,evaluationcash));
    const result = node.operand.eval(parentsvalues);
    evaluationcash.set(node, result);
    return result;
}

//alternative implementation of evaluatenode that uses visitnodes to evaluate the graph in topological order
//i think this has more overhead but is more readable
function evaluatenodes(nodes, evaluationcash = new Map()) {
    visitnodes(nodes, (node, parentresults) => {
        if (node.operand instanceof VarOperand) {
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


    map(func) {
        const newMultivector = new Multivector();
        for (const [index, value] of this._values.entries()) {
            newMultivector.set(index, func(value, index));
        }
        return newMultivector;
    }

    entries() {
        return this._values.entries();
    }

    values() {  
        return this._values.values();
    }

    keys() {
        return this._values.keys();
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
        return `rgb(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }
}

class GaalopGraph {
    constructor() {
        this.name = undefined;
        this.inputScalars = new Map(); // variablename->variable
        this.outputMultivectors = new Map(); // name -> Multivector of nodes

        this.vissualization = new Map(); //name (of output node) -> color
        this.renderingExpression = new Map(); //name (of inner product result) -> expression

    }
}
    
function loadGaalopjson(jsonstring){
    const json=JSON.parse(jsonstring);
    const graph=new GaalopGraph();
    graph.name=json.name;

    const Multivectors=new Map(); // name -> Multivector of nodes
    const scalars=new Map(); // name -> node

    for(const [index, inputScalar] of json.inputScalars.entries()){
        const node=new GraphNode(new VarOperand(inputScalar));
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
            graph.vissualization.set(node.expression.name,activeColor);
        } else {
            throw new Error(`Unknown node type: ${node.type}`);
        }
        
    }

    for (const name of json.outputMultivectors) {
        graph.outputMultivectors.set(name, Multivectors.get(name));
    }




    return graph;

}


var path="G:\\Users\\konst\\data\\gaalop\\input\\jsonexport.json";
var fs = require('fs');
fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    const graph=loadGaalopjson(data);
    console.log(graph);


    //graphtocode( Array.from(graph.outputMultivectors.values().flatMap((multivector) => Array.from(multivector.values()))));

    let graphoutputnodes=Array.from(graph.outputMultivectors.values().flatMap((multivector) => Array.from(multivector.values())));
    outputnodes=[...commonsubexpressionelimination(graphoutputnodes).values()];
    graphtocode(outputnodes);

    const visualisationgraphs=createVisualisationgraphs1(graph);
    console.log(visualisationgraphs);
});

function topologicalsort(outputnodes){
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



function graphtocode(outputnodes,inlineconstants=true) {

    if (outputnodes instanceof GraphNode) {
        outputnodes=[outputnodes];
    }

    //outputnodes :name->node
    const topsort=topologicalsort(outputnodes);

    var assignmentnodes=new Set();
    //var inputnodes=new Set();

    {
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

        if(inlineconstants){
            //all nodes with no parents are constants and can be inlined
            for (const node of topsort) {
                if (node.operand instanceof ConstOperand) {
                    assignmentnodes.delete(node);
                }
            }
        }


    }

    

    /*
    var noderepresentation=new Map(); //node->string
    code="";
    for (const node of topsort) {
        if (inpuitnodes.has(node)) {
            noderepresentation.set(node, node.stringifyop());//Variables are represented by their name
        } else if (assignmentnodes.has(node)) {
            //make up name for node
            const name = `node${topsort.indexOf(node)}`;
            //if
            noderepresentation.set(node,name);//assignmentnodes get a new name

            code+=name+"="+node.stringifyop(node.parents.map((parent) => noderepresentation.get(parent)))+";\n";
        } else {
            noderepresentation.set(node, node.stringifyop(node.parents.map((parent) => noderepresentation.get(parent))));
        }
    }*/


    var code="";
    visitnodes(topsort,
        (node,parentresults)=>{
            /*if (inputnodes.has(node)){
                return node.operand.stringify();//Variables are represented by their name
            } else */
            if(assignmentnodes.has(node)){
                //make up name for node
                const name = `node${topsort.indexOf(node)}`;
                code+=name+"="+node.operand.stringify(parentresults)+";\n";
                return name;
            } else {
                return node.operand.stringify(parentresults);
            }
        }
    )

    console.log(code);



    

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



function commonsubexpressionelimination(nodes) {
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
function visitnodes(nodes,visitfunc,resultcache=new Map()) {

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

/**
 * 
 * @param {GaalopGraph} gaalopgraph 
 * @returns {VisualisationGraph[]} list of visualisation graphs
 */
function createVisualisationgraphs1(gaalopgraph) {

    VisualisationGraphs=[];
    xyz=[..."XYZ"].map((cord)=>gaalopgraph.inputScalars.get("_V_"+cord));
    const inputnodes=new Map(xyz.map((node)=>[node,node]));
    for (const [innerProductResultName,outputMultivectorName] of gaalopgraph.renderingExpression.entries()) {
       const innerProductResult=gaalopgraph.outputMultivectors.get(innerProductResultName);
       const innerProductInput=gaalopgraph.outputMultivectors.get(outputMultivectorName);
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




        //the original multivector should be computed on the CPU and then the results should be passed to the GPU
        /** 
         * @type {Multivector<GraphNode>} 
         * @description The original multivector. this multivector holds the output for the CPU graph.
        */
        this.originalMultivector = originalMultivector;

        this.argslength=argslength;

        
        



        
    }

    evaluateCPUgraph(inputvaluescache) {
        return evaluatenodes(this.GPUresult.values(), evaluationcash);
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




}
