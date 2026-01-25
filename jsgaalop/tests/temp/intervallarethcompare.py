

def old(_V_X, _V_Y, _V_Z,delta,args):
    _node0 = -1.0
    _node1 = (1.0*delta)
    _node2 = (_node1*_node1)
    _node3 = (_node0*(args[0]*_node2))
    _node4 = -4.0
    _node5 = 2.0
    _node6 = (_node2/_node5)
    _node7 = (_V_X*_V_X)
    _node8 = (_V_Y*_V_Y)
    _node9 = (((_node7+_node8)+(_V_Z*_V_Z))/_node5)
    _node10 = (_node6*_node9)
    _node11 = (_node1*_V_X)
    _node12 = (_node11+_node11)
    _node13 = (_node12/_node5)
    _node14 = (_node0*(args[1]*_node6))
    _node15 = (((_node3+(_node0*(_node4*((_node10+(_node13*_node13))+_node10))))+_node14)+_node14)
    _node16 = 0.0
    _node17 = (_node13*_node9)
    _node18 = (_node0*(args[1]*_node13))
    _node19 = abs(((((_node0*(args[0]*_node12))+(_node0*(_node4*(_node17+_node17))))+_node18)+_node18))
    _node20 = (_node0*(args[1]*_node9))
    _node21 = ((((((_node0*(args[0]*_node7))+(_node0*(args[0]*_node8)))+(_node0*(_node4*(_node9*_node9))))+_node20)+_node20)+args[2])
    _node22 = (_node10+_node10)
    _node23 = (_node1*_V_Y)
    _node24 = (_node23+_node23)
    _node25 = (_node24/_node5)
    _node26 = (((_node3+(_node0*(_node4*(_node22+(_node25*_node25)))))+_node14)+_node14)
    _node27 = (_node9*_node25)
    _node28 = (_node0*(args[1]*_node25))
    _node29 = abs(((((_node0*(args[0]*_node24))+(_node0*(_node4*(_node27+_node27))))+_node28)+_node28))
    _node30 = (_node6*_node6)
    _node31 = (_node0*(_node4*_node30))
    _node32 = min(_node31,_node16)
    _node33 = (_node6*_node13)
    _node34 = abs((_node0*(_node4*(_node33+_node33))))
    _node35 = (-_node34)
    _node36 = (_node0*(_node4*(_node30+_node30)))
    _node37 = min(_node36,_node16)
    _node38 = (_node6*_node25)
    _node39 = abs((_node0*(_node4*(_node38+_node38))))
    _node40 = (-_node39)
    _node41 = (_node1*_V_Z)
    _node42 = ((_node41+_node41)/_node5)
    _node43 = (_node6*_node42)
    _node44 = abs((_node0*(_node4*(_node43+_node43))))
    _node45 = (-_node44)
    _node46 = (_node13*_node25)
    _node47 = abs((_node0*(_node4*(_node46+_node46))))
    _node48 = (_node13*_node42)
    _node49 = abs((_node0*(_node4*(_node48+_node48))))
    _node50 = (((_node0*(_node4*(_node22+(_node42*_node42))))+_node14)+_node14)
    _node51 = (_node9*_node42)
    _node52 = (_node0*(args[1]*_node42))
    _node53 = abs((((_node0*(_node4*(_node51+_node51)))+_node52)+_node52))
    _node54 = (_node25*_node42)
    _node55 = abs((_node0*(_node4*(_node54+_node54))))
    _node56 = max(_node31,_node16)
    _node57 = max(_node36,_node16)
    low=((((((((((((((((((((((((min(_node15,_node16)+(-_node19))+_node21)+min(_node26,_node16))+(-_node29))+_node32)+_node35)+_node37)+_node40)+_node37)+_node45)+_node35)+(-_node47))+_node35)+(-_node49))+min(_node50,_node16))+(-_node53))+_node32)+_node40)+_node37)+_node45)+_node40)+(-_node55))+_node32)+_node45)
    high=((((((((((((((((((((((((max(_node15,_node16)+_node19)+_node21)+max(_node26,_node16))+_node29)+_node56)+_node34)+_node57)+_node39)+_node57)+_node44)+_node34)+_node47)+_node34)+_node49)+max(_node50,_node16))+_node53)+_node56)+_node39)+_node57)+_node44)+_node39)+_node55)+_node56)+_node44)
    return locals()





def new(_V_X, _V_Y, _V_Z,delta,args):
    _generatednode0 = (delta*delta)
    _generatednode1 = (args[0]*_generatednode0)
    _generatednode2 = (_generatednode0*0.5)
    _generatednode3 = (_V_X*_V_X)
    _generatednode4 = (_V_Y*_V_Y)
    _generatednode5 = (((_generatednode3+_generatednode4)+(_V_Z*_V_Z))*0.5)
    _generatednode6 = (_generatednode2*_generatednode5)
    _generatednode7 = (delta*_V_X)
    _generatednode8 = (_generatednode7+_generatednode7)
    _generatednode9 = (_generatednode8*0.5)
    _generatednode10 = (args[1]*_generatednode2)
    _generatednode11 = (-(((_generatednode1+(((_generatednode6+(_generatednode9*_generatednode9))+_generatednode6)*-4.0))+_generatednode10)+_generatednode10))
    _generatednode12 = (_generatednode9*_generatednode5)
    _generatednode13 = (args[1]*_generatednode9)
    _generatednode14 = abs((-((((args[0]*_generatednode8)+((_generatednode12+_generatednode12)*-4.0))+_generatednode13)+_generatednode13)))
    _generatednode15 = (args[1]*_generatednode5)
    _generatednode16 = (args[2]-(((((args[0]*_generatednode3)+(args[0]*_generatednode4))+((_generatednode5*_generatednode5)*-4.0))+_generatednode15)+_generatednode15))
    _generatednode17 = (_generatednode6+_generatednode6)
    _generatednode18 = (delta*_V_Y)
    _generatednode19 = (_generatednode18+_generatednode18)
    _generatednode20 = (_generatednode19*0.5)
    _generatednode21 = (-(((_generatednode1+((_generatednode17+(_generatednode20*_generatednode20))*-4.0))+_generatednode10)+_generatednode10))
    _generatednode22 = (_generatednode5*_generatednode20)
    _generatednode23 = (args[1]*_generatednode20)
    _generatednode24 = abs((-((((args[0]*_generatednode19)+((_generatednode22+_generatednode22)*-4.0))+_generatednode23)+_generatednode23)))
    _generatednode25 = (_generatednode2*_generatednode2)
    _generatednode26 = (-(_generatednode25*-4.0))
    _generatednode27 = min(_generatednode26,0.0)
    _generatednode28 = (_generatednode2*_generatednode9)
    _generatednode29 = abs((-((_generatednode28+_generatednode28)*-4.0)))
    _generatednode30 = (-((_generatednode25+_generatednode25)*-4.0))
    _generatednode31 = min(_generatednode30,0.0)
    _generatednode32 = (_generatednode2*_generatednode20)
    _generatednode33 = abs((-((_generatednode32+_generatednode32)*-4.0)))
    _generatednode34 = (delta*_V_Z)
    _generatednode35 = ((_generatednode34+_generatednode34)*0.5)
    _generatednode36 = (_generatednode2*_generatednode35)
    _generatednode37 = abs((-((_generatednode36+_generatednode36)*-4.0)))
    _generatednode38 = (_generatednode9*_generatednode20)
    _generatednode39 = abs((-((_generatednode38+_generatednode38)*-4.0)))
    _generatednode40 = (_generatednode9*_generatednode35)
    _generatednode41 = abs((-((_generatednode40+_generatednode40)*-4.0)))
    _generatednode42 = (-((((_generatednode17+(_generatednode35*_generatednode35))*-4.0)+_generatednode10)+_generatednode10))
    _generatednode43 = (_generatednode5*_generatednode35)
    _generatednode44 = (args[1]*_generatednode35)
    _generatednode45 = abs((-((((_generatednode43+_generatednode43)*-4.0)+_generatednode44)+_generatednode44)))
    _generatednode46 = (_generatednode20*_generatednode35)
    _generatednode47 = abs((-((_generatednode46+_generatednode46)*-4.0)))
    _generatednode48 = max(_generatednode26,0.0)
    _generatednode49 = max(_generatednode30,0.0)
    low=(min(_generatednode11,0.0)+_generatednode14+_generatednode16+min(_generatednode21,0.0)+_generatednode24+_generatednode27+_generatednode29+_generatednode31+_generatednode33+_generatednode31+_generatednode37+_generatednode29+_generatednode39+_generatednode29+_generatednode41+min(_generatednode42,0.0)+_generatednode45+_generatednode27+_generatednode33+_generatednode31+_generatednode37+_generatednode33+_generatednode47+_generatednode27+_generatednode37)
    high=((max(_generatednode11,0.0)+_generatednode16+max(_generatednode21,0.0)+_generatednode48+_generatednode49+_generatednode49+max(_generatednode42,0.0)+_generatednode48+_generatednode49+_generatednode48)-(_generatednode14+_generatednode24+_generatednode29+_generatednode33+_generatednode37+_generatednode29+_generatednode39+_generatednode29+_generatednode41+_generatednode45+_generatednode33+_generatednode37+_generatednode33+_generatednode47+_generatednode37))
    return locals()

import random

randargs={
    "_V_X":random.random(),
    "_V_Y":random.random(),
    "_V_Z":random.random(),
    "delta":random.random(),
    "args":[random.random() for i in range(3)]
}
oldresults=old(**randargs)
newresults=new(**randargs)

merged={
    **{"old_"+k:v for k,v in oldresults.items()},
    **{"new_"+k:v for k,v in newresults.items()}} 

for args in ["old_args","new_args"]:
    for i,v in enumerate(merged[args]):
        merged[f"{args}[{i}]"]=v
    del merged[args]

clusters={k:{k} for k in merged}# node=>set of nodes
def mergeclusters(c1,c2):
    if c1 is c2:
        return
    for k in c2:
        clusters[k]=c1
    c1.update(c2)


import itertools

pairs=[(k1,k2,abs(v1-v2))for ((k1,v1),(k2,v2))in itertools.combinations(merged.items(),2)]
for k1,k2,delta in sorted(pairs,key=lambda k:k[2]):
    if delta<1e-7:
        mergeclusters(clusters[k1],clusters[k2])
    else: 
        break
#print(oldresults)
#print(newresults)
#print(clusters)

covered=set()
uniques=[]
for k,v in clusters.items():
    if k not in covered:
        uniques.append(v)
        covered|=v
print(uniques)

uniques.sort(key=len)
for u in uniques:
    values=[merged[x] for x in u]
    print(u,max(values)-min(values),max(values),min(values))


newcode="""
def new(_V_X, _V_Y, _V_Z,delta,args):
    _generatednode0 = (delta*delta)
    _generatednode1 = (args[0]*_generatednode0)
    _generatednode2 = (_generatednode0*0.5)
    _generatednode3 = (_V_X*_V_X)
    _generatednode4 = (_V_Y*_V_Y)
    _generatednode5 = (((_generatednode3+_generatednode4)+(_V_Z*_V_Z))*0.5)
    _generatednode6 = (_generatednode2*_generatednode5)
    _generatednode7 = (delta*_V_X)
    _generatednode8 = (_generatednode7+_generatednode7)
    _generatednode9 = (_generatednode8*0.5)
    _generatednode10 = (args[1]*_generatednode2)
    _generatednode11 = (-(((_generatednode1+(((_generatednode6+(_generatednode9*_generatednode9))+_generatednode6)*-4.0))+_generatednode10)+_generatednode10))
    _generatednode12 = (_generatednode9*_generatednode5)
    _generatednode13 = (args[1]*_generatednode9)
    _generatednode14 = abs((-((((args[0]*_generatednode8)+((_generatednode12+_generatednode12)*-4.0))+_generatednode13)+_generatednode13)))
    _generatednode15 = (args[1]*_generatednode5)
    _generatednode16 = (args[2]-(((((args[0]*_generatednode3)+(args[0]*_generatednode4))+((_generatednode5*_generatednode5)*-4.0))+_generatednode15)+_generatednode15))
    _generatednode17 = (_generatednode6+_generatednode6)
    _generatednode18 = (delta*_V_Y)
    _generatednode19 = (_generatednode18+_generatednode18)
    _generatednode20 = (_generatednode19*0.5)
    _generatednode21 = (-(((_generatednode1+((_generatednode17+(_generatednode20*_generatednode20))*-4.0))+_generatednode10)+_generatednode10))
    _generatednode22 = (_generatednode5*_generatednode20)
    _generatednode23 = (args[1]*_generatednode20)
    _generatednode24 = abs((-((((args[0]*_generatednode19)+((_generatednode22+_generatednode22)*-4.0))+_generatednode23)+_generatednode23)))
    _generatednode25 = (_generatednode2*_generatednode2)
    _generatednode26 = (-(_generatednode25*-4.0))
    _generatednode27 = min(_generatednode26,0.0)
    _generatednode28 = (_generatednode2*_generatednode9)
    _generatednode29 = abs((-((_generatednode28+_generatednode28)*-4.0)))
    _generatednode30 = (-((_generatednode25+_generatednode25)*-4.0))
    _generatednode31 = min(_generatednode30,0.0)
    _generatednode32 = (_generatednode2*_generatednode20)
    _generatednode33 = abs((-((_generatednode32+_generatednode32)*-4.0)))
    _generatednode34 = (delta*_V_Z)
    _generatednode35 = ((_generatednode34+_generatednode34)*0.5)
    _generatednode36 = (_generatednode2*_generatednode35)
    _generatednode37 = abs((-((_generatednode36+_generatednode36)*-4.0)))
    _generatednode38 = (_generatednode9*_generatednode20)
    _generatednode39 = abs((-((_generatednode38+_generatednode38)*-4.0)))
    _generatednode40 = (_generatednode9*_generatednode35)
    _generatednode41 = abs((-((_generatednode40+_generatednode40)*-4.0)))
    _generatednode42 = (-((((_generatednode17+(_generatednode35*_generatednode35))*-4.0)+_generatednode10)+_generatednode10))
    _generatednode43 = (_generatednode5*_generatednode35)
    _generatednode44 = (args[1]*_generatednode35)
    _generatednode45 = abs((-((((_generatednode43+_generatednode43)*-4.0)+_generatednode44)+_generatednode44)))
    _generatednode46 = (_generatednode20*_generatednode35)
    _generatednode47 = abs((-((_generatednode46+_generatednode46)*-4.0)))
    _generatednode48 = max(_generatednode26,0.0)
    _generatednode49 = max(_generatednode30,0.0)
    low=(min(_generatednode11,0.0)+_generatednode14+_generatednode16+min(_generatednode21,0.0)+_generatednode24+_generatednode27+_generatednode29+_generatednode31+_generatednode33+_generatednode31+_generatednode37+_generatednode29+_generatednode39+_generatednode29+_generatednode41+min(_generatednode42,0.0)+_generatednode45+_generatednode27+_generatednode33+_generatednode31+_generatednode37+_generatednode33+_generatednode47+_generatednode27+_generatednode37)
    high=((max(_generatednode11,0.0)+_generatednode16+max(_generatednode21,0.0)+_generatednode48+_generatednode49+_generatednode49+max(_generatednode42,0.0)+_generatednode48+_generatednode49+_generatednode48)-(_generatednode14+_generatednode24+_generatednode29+_generatednode33+_generatednode37+_generatednode29+_generatednode39+_generatednode29+_generatednode41+_generatednode45+_generatednode33+_generatednode37+_generatednode33+_generatednode47+_generatednode37))

"""
import re
for u in uniques:
    if len(u)!=2:continue
    x1,x2=u
    if x1.startswith("new") and x2.startswith("old"):
        x2,x1=x1,x2
    if x1.startswith("old") and x2.startswith("new"):

        pattern = rf'(?<!\w){x2[4:]}(?!\w)'
        newcode = re.sub(pattern, x1[4:], newcode)
        print(x1[4:],x2[4:])

        
        
print(newcode)
