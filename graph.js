
class GraphNode {
    constructor(parents) {
        this.parents = parents;
    }

    evalop(parentsvalues) {
        //evaluate the node given the values of its parents
        //evaluate op stands for evaluate operation whch means we evalute the node operation
        //the parents can be different than the parents of the node
        throw new Error("eval method not implemented");
    }

    stringifyop(parentstrings) {
        throw new Error("stringify method not implemented");
    }

    copyop(parents) {
        //create a new node of the same type with different parents
        return new this.constructor(parents);
    }
}

class AddNode extends GraphNode {
    evalop(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc + val, 0);
    }
    stringifyop(parentstrings) {
        return "("+parentstrings.join("+")+")";
    }

}

class MulNode extends GraphNode {
    evalop(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc * val, 1);
    }
    stringifyop(parentstrings) {
        return "("+parentstrings.join("*")+")";
    }
}

class SubNode extends GraphNode {
    evalop(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc - val);
    }
    stringifyop(parentstrings) {
        return "("+parentstrings.join("-")+")";
    }
}

class DivNode extends GraphNode {
    evalop(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc / val);
    }
    stringifyop(parentstrings) {
        return "("+parentstrings.join("/")+")";
    }
}

class ConstNode extends GraphNode {
    constructor(value) {
        super([]);
        this.value = value;
    }

    evalop(parentsvalues) {
        return this.value;
    }
    stringifyop(parentstrings) {
        return this.value.toString();
    }
    copyop(parents) {
        return new this.constructor(this.value);
    }
}

class VarNode extends GraphNode {
    constructor(name) {
        super([]);
        this.name = name;
    }
    stringifyop(parentstrings) {
        return this.name;
    }
    copyop(parents) {
        return new this.constructor(this.name);
    }
}

class UnaryNode extends GraphNode {
    constructor(parent,fun) {
        if (parent instanceof GraphNode) { super([parent]); }
        else if (parent instanceof Array) {
            if (parent.length !== 1) throw new Error("UnaryNode must have exactly one parent");
            super(parent); 
        }
        this.fun=fun;
    }
    evalop(parentsvalues) {
        return this.fun(parentsvalues[0]);
    }
    copyop(parents) {
        return new this.constructor(parents[0],this.fun);
    }

}

class NegNode extends UnaryNode {
    constructor(parent) {
        super(parent, (x) => -x);
    }
    stringifyop(parentstrings) {
        return "(-"+parentstrings[0]+")";
    }
}

class AbsNode extends UnaryNode {
    constructor(parent) {
        super(parent, (x) => Math.abs(x));
    }
    stringifyop(parentstrings) {
        return "abs("+parentstrings[0]+")";
    }
}

class SqrtNode extends UnaryNode {
    constructor(parent) {
        super(parent, (x) => Math.sqrt(x));
    }
    stringifyop(parentstrings) {
        return "sqrt("+parentstrings[0]+")";
    }
}

function evaluatenode(node,evaluationcash=new Map()) {
    if (evaluationcash.has(node)) {
        return evaluationcash.get(node);
    }
    if (node instanceof VarNode) {
        throw new Error(`Variable ${node.name} not found in evaluation cache`);
    }
    const parentsvalues = node.parents.map((parent) => evaluatenode(parent,evaluationcash));
    const result = node.evalop(parentsvalues);
    evaluationcash.set(node, result);
    return result;
}

//alternative implementation of evaluatenode that uses visitnodes to evaluate the graph in topological order
//i think this has more overhead but is more readable
function evaluatenodes(nodes, evaluationcash = new Map()) {
    visitnodes(nodes, (node, parentresults) => {
        if (node instanceof VarNode) {
            throw new Error(`Variable ${node.name} not found in evaluation cache`);
        }
        return node.evalop(parentresults);
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
        this.values = new Map();
        //this.name = name;
    }

    set(index, value) {
        this.values.set(index, value);
    }

    get(index) {
        return this.values.get(index);
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

    }
}
    
function loadGaalopjson(jsonstring){
    const json=JSON.parse(jsonstring);
    const graph=new GaalopGraph();
    graph.name=json.name;

    const Multivectors=new Map(); // name -> Multivector of nodes
    const scalars=new Map(); // name -> node

    for(const [index, inputScalar] of json.inputScalars.entries()){
        const node=new VarNode(inputScalar);
        graph.inputScalars.set(inputScalar, node);
        scalars.set(inputScalar, node);
        scalars.set("inputsVector["+index+"]", node);//gapp behaves weirdly and uses inputsVector[index] instead of name
    }
    //const inputsVector = json.inputScalars;


    function parseExpression(node) {
        if (node.type === "Mul") {
            const left = parseExpression(node.left);
            const right = parseExpression(node.right);
            return new MulNode([left, right]);
        } else if (node.type === "Add") {
            const left = parseExpression(node.left);
            const right = parseExpression(node.right);
            return new AddNode([left, right]);
        } else if (node.type === "Sub") {
            const left = parseExpression(node.left);
            const right = parseExpression(node.right);
            return new SubNode([left, right]);
        } else if (node.type === "Div") {
            const left = parseExpression(node.left);
            const right = parseExpression(node.right);
            return new DivNode([left, right]);
        } else if (node.type === "Const") {
            return new ConstNode(node.value);
        } else if (node.type === "Negation") {
            return  new NegNode(parseExpression(node.operand));
        } else if (node.type === "MathFunctionCall") {
            const func = node.function;
            const operand = parseExpression(node.operand);
            if (func === "abs") {
                return new AbsNode(operand);
            } else if (func === "sqrt") {
                return new SqrtNode(operand);
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
    graphtocode( Array.from(graph.outputMultivectors.values().flatMap((multivector) => Array.from(multivector.values.values()))));
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

function graphtocode(outputnodes){

    if (outputnodes instanceof GraphNode) {
        outputnodes=[outputnodes];
    }

    //outputnodes :name->node
    const topsort=topologicalsort(outputnodes);

    var assignmentnodes=new Set();
    var inputnodes=new Set();

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

        //Variable nodes are input nodes
        for (const node of topsort) {
            if (node instanceof VarNode) {
                inputnodes.add(node);
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
            if (inputnodes.has(node)){
                return node.stringifyop();//Variables are represented by their name
            } else if(assignmentnodes.has(node)){
                //make up name for node
                const name = `node${topsort.indexOf(node)}`;
                code+=name+"="+node.stringifyop(parentresults)+";\n";
                return name;
            } else {
                return node.stringifyop(parentresults);
            }
        }
    )

    console.log(code);



    

}






function visitnodes(nodes,visitfunc,resultcash=new Map()) {

    const topsort=topologicalsort(nodes);
    
    for (const node of topsort) {
        const parentresults=node.parents.map((parent) => resultcash.get(parent));
        resultcash.set(node,visitfunc(node,parentresults,resultcash));
    }
    return resultcash;
}


//todo: make a node visitor that can be used to traverse the graph and do something with each node
 