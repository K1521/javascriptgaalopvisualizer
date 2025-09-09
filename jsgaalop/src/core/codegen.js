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


export class GraphNodeTyped extends GraphNode {
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
}

export class MultiOutputOperand extends Operand {
    static instance = new MultiOutputOperand();
}

export class MaxOperand extends Operand {
    eval(parentsvalues) {
        return Math.max(...parentsvalues);
    }
    static instance = new MaxOperand();
}
export class MinOperand extends Operand {
    eval(parentsvalues) {
        return Math.min(...parentsvalues);
    }
    static instance = new MinOperand();
}


    

export class AddOperand extends Operand {
    eval(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc + val, 0);
    }
    static instance = new AddOperand();
}

export class MulOperand extends Operand {
    eval(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc * val, 1);
    }
    static instance = new MulOperand();
}

export class SubOperand extends Operand {
    eval(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc - val);
    }
    static instance = new SubOperand();
}

export class DivOperand extends Operand {
    eval(parentsvalues) {
        return parentsvalues.reduce((acc, val) => acc / val);
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
}

export class VarOperand extends Operand {
    constructor(name) {
        super();
        this.name = name;
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
    static instance = new NegOperand();
}

export class AbsOperand extends UnaryOperand {
    constructor() {
        super((x) => Math.abs(x));
    }
    static instance = new AbsOperand();
}

export class SqrtOperand extends UnaryOperand {
    constructor() {
        super((x) => Math.sqrt(x));
    }
    static instance = new SqrtOperand();
}


/**
 * @template T
 * @param {GraphNode} node - The root of the nodes to visit.
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

    if(nodes==undefined)throw new Error("encountered undefined");
    if (nodes instanceof GraphNode) throw new Error("not a graphnode");
        
    visit(nodes);
    
    return resultcache;
}


function topsort(node,visited=new Set(),stack=[]){
    if(visited.has(node))return;
    visited.add(node);
    for(let parent of node.parents){
        topsort(parent,visited,stack);
    }
    stack.push(node);
    return stack;
}


computeassignmentnodes(nodes,inlineconstants=true) {
        

    
        var assignmentnodes=new Set();
        //var inputnodes=new Set();
    
        
        //all nodes with more than one child are assignment nodes so their values can be reused
        const numberofchildren=new Map();
        for (const node of nodes) {
            numberofchildren.set(node,0);
        }
        for (const node of nodes) {
            for (const parent of node.parents) {
                numberofchildren.set(parent,numberofchildren.get(parent)+1);
            }
        }
        for (const node of nodes) {
            if (numberofchildren.get(node)>1) {
                assignmentnodes.add(node);
            }
        }

        //all output nodes are assignment nodes
        for (const node of outputnodes) {
            assignmentnodes.add(node);
        }

        //Variable nodes dont need to be assigned a name
        for (const node of nodes) {
            if (node.operand instanceof VarOperand) {
                //inputnodes.add(node);
                assignmentnodes.delete(node);
            }
        }

        if(this.inlineconstants){
            for (const node of nodes) {
                if (node.operand instanceof ConstOperand) {
                    assignmentnodes.delete(node);
                }
            }
        }
        return assignmentnodes;
    }

function makeplan(root){
 const nodes=topsort(root);   
 const assignmentnodes=computeassignmentnodes(root);
}