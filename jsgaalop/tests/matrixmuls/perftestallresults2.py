tests="""
PC:Akoya Browser:Firefox
5,5,14,70,657 results+=horner(a.x,coeffs); 0
5,6,26,212 results+=rowM(pos); 0
3,5,16,125 results+=rowMDense(pos); 0
45,416 results+=susR(pos); 0
66,630 results+=susM(pos); 0
21,179 results+=susMDense(pos); 0
67,631 results+=susMPad(pos); 0
5,6,20,152 results+=dot(DChorner(a,coeffs),vec4(1)); 0
5,11,74,690 results+=dot(DCrowM(ro,rd,a),vec4(1)); 0
5,10,72,687 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 0
45,421 results+=dot(DCsusR(ro,rd,a),vec4(1)); 0
66,630 results+=dot(DCsusM(ro,rd,a),vec4(1)); 0
23,179 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 0
66,631 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 0
5,11,72,690 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 0
3,6,25,213 results+=rowCopy(c,pos); 0
5,4,16,124 results+=rowCopyDense(cDense,pos); 0
4,4,16,124 results+=rowCopyDenseUnrolled(cDense,pos); 0
18,139 results+=susRDense(pos); 0
41,382 results+=dot(DCsusMDense2(ro,rd,a),vec4(1)); 0
18,138 results+=susRDense(pos); 0
117 results+=dot(DCsusRDenseReversed(ro,rd,a),vec4(1)); 0
7,30,235 results+=dot(DCsusRDenseUnrolled(ro,rd,a),vec4(1)); 0
5,11,83,800 results+=susRDenseUnrolled(pos); 0
8,38,351 results+=susMUnrolled(pos); 0
5,19,139 results+=susRUnrolled(pos); 0
7,17,140 results+=susRUnrolledReversed(pos); 0
5,12,84,802 results+=susRDenseUnrolledReversed(pos); 0
8,27,240 results+=dot(DCsusRDenseUnrolledReversed(ro,rd,a),vec4(1)); 0
8,7,12,67,625 results+=horner(a.x,coeffs); 1
7,6,26,217 results+=rowM(pos); 1
7,7,17,130 results+=rowMDense(pos); 1
40,356 results+=susR(pos); 1
28,242 results+=susM(pos); 1
12,86,828 results+=susMDense(pos); 1
29,249 results+=susMPad(pos); 1
7,7,22,138 results+=dot(DChorner(a,coeffs),vec4(1)); 1
7,11,75,710 results+=dot(DCrowM(ro,rd,a),vec4(1)); 1
7,11,73,701 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 1
37,341 results+=dot(DCsusR(ro,rd,a),vec4(1)); 1
27,235 results+=dot(DCsusM(ro,rd,a),vec4(1)); 1
15,107 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 1
30,236 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 1
7,11,75,711 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 1
7,7,27,217 results+=rowCopy(c,pos); 1
7,7,19,131 results+=rowCopyDense(cDense,pos); 1
7,6,17,130 results+=rowCopyDenseUnrolled(cDense,pos); 1
17,136 results+=susRDense(pos); 1
20,154 results+=dot(DCsusMDense2(ro,rd,a),vec4(1)); 1
18,136 results+=susRDense(pos); 1
105 results+=dot(DCsusRDenseReversed(ro,rd,a),vec4(1)); 1
11,31,252 results+=dot(DCsusRDenseUnrolled(ro,rd,a),vec4(1)); 1
8,14,86,807 results+=susRDenseUnrolled(pos); 1
165 results+=susMUnrolled(pos); 1
72,288 results+=susRUnrolled(pos); 1
72,290 results+=susRUnrolledReversed(pos); 1
9,14,85,799 results+=susRDenseUnrolledReversed(pos); 1
10,30,256 results+=dot(DCsusRDenseUnrolledReversed(ro,rd,a),vec4(1)); 1

PC:Akoya Browser:Edge
4.5,4.199999988079071,13.400000035762787,68.30000001192093,656.8000000119209 results+=horner(a.x,coeffs); 0
2.800000011920929,3.800000011920929,23.19999998807907,210.69999998807907 results+=rowM(pos); 0
2.699999988079071,2.799999952316284,14.599999964237213,122.69999998807907 results+=rowMDense(pos); 0
16.399999976158142,142.69999998807907 results+=susR(pos); 0
6.100000023841858,37,348.5 results+=susM(pos); 0
4,15.699999988079071,133 results+=susMDense(pos); 0
39.80000001192093,378.19999998807907 results+=susMPad(pos); 0
3,3.899999976158142,19.900000035762787,171.79999995231628 results+=dot(DChorner(a,coeffs),vec4(1)); 0
3.099999964237213,9.300000011920929,71.09999996423721,688.6999999880791 results+=dot(DCrowM(ro,rd,a),vec4(1)); 0
2.800000011920929,8.700000047683716,70.30000001192093,684.5 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 0
16.69999998807907,142.89999997615814 results+=dot(DCsusR(ro,rd,a),vec4(1)); 0
7,45.39999997615814,434.30000001192093 results+=dot(DCsusM(ro,rd,a),vec4(1)); 0
14.899999976158142,121 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 0
39.69999998807907,378 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 0
2.800000011920929,9.5,70.60000002384186,688.8000000119209 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 0
3,4.199999988079071,23.30000001192093,211 results+=rowCopy(c,pos); 0
2.199999988079071,3.699999988079071,13.699999988079071,123.19999998807907 results+=rowCopyDense(cDense,pos); 0
2.699999988079071,3.200000047683716,13.699999988079071,123.29999995231628 results+=rowCopyDenseUnrolled(cDense,pos); 0
13.099999964237213,111.09999996423721 results+=susRDense(pos); 0
33.200000047683716,314.5999999642372 results+=dot(DCsusMDense2(ro,rd,a),vec4(1)); 0
13.099999964237213,110.79999995231628 results+=susRDense(pos); 0
105.5 results+=dot(DCsusRDenseReversed(ro,rd,a),vec4(1)); 0
5.199999988079071,25.5,232.69999998807907 results+=dot(DCsusRDenseUnrolled(ro,rd,a),vec4(1)); 0
3.799999952316284,10.400000035762787,81.89999997615814,798.3999999761581 results+=susRDenseUnrolled(pos); 0
6.600000023841858,36.69999998807907,349.30000001192093 results+=susMUnrolled(pos); 0
3.800000011920929,16.099999964237213,136.69999998807907 results+=susRUnrolled(pos); 0
3.800000011920929,16,138.5 results+=susRUnrolledReversed(pos); 0
3.699999988079071,10.300000011920929,81.89999997615814,798.8999999761581 results+=susRDenseUnrolledReversed(pos); 0
5.100000023841858,25.700000047683716,237.30000001192093 results+=dot(DCsusRDenseUnrolledReversed(ro,rd,a),vec4(1)); 0
6.199999988079071,5.399999976158142,10.5,64.59999996423721,621.2999999523163 results+=horner(a.x,coeffs); 1
4.699999988079071,4.899999976158142,23.099999964237213,214.89999997615814 results+=rowM(pos); 1
4.699999988079071,4.5,14.800000011920929,128.69999998807907 results+=rowMDense(pos); 1
19.099999964237213,173.80000001192093 results+=susR(pos); 1
26.5,238.69999998807907 results+=susM(pos); 1
9.799999952316284,73.69999998807907,714.8000000119209 results+=susMDense(pos); 1
26.600000023841858,245.19999998807907 results+=susMPad(pos); 1
5.599999964237213,5.299999952316284,16.899999976158142,138 results+=dot(DChorner(a,coeffs),vec4(1)); 1
5.5,10.799999952316284,73.19999998807907,709.0999999642372 results+=dot(DCrowM(ro,rd,a),vec4(1)); 1
5.099999964237213,9.899999976158142,71.69999998807907,699.3000000119209 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 1
17.19999998807907,159.9000000357628 results+=dot(DCsusR(ro,rd,a),vec4(1)); 1
25.399999976158142,226.69999998807907 results+=dot(DCsusM(ro,rd,a),vec4(1)); 1
12.300000011920929,96.59999996423721,952.9000000357628 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 1
25.600000023841858,231.39999997615814 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 1
5.699999988079071,9.899999976158142,73.30000001192093,708.8000000119209 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 1
4.699999988079071,5,23.899999976158142,215.39999997615814 results+=rowCopy(c,pos); 1
5.199999988079071,5.699999988079071,15.300000011920929,129.39999997615814 results+=rowCopyDense(cDense,pos); 1
4.400000035762787,5.100000023841858,14.699999988079071,129.29999995231628 results+=rowCopyDenseUnrolled(cDense,pos); 1
12.300000011920929,101.80000001192093 results+=susRDense(pos); 1
16.5,138.0999999642372 results+=dot(DCsusMDense2(ro,rd,a),vec4(1)); 1
12,101.89999997615814 results+=susRDense(pos); 1
100.60000002384186 results+=dot(DCsusRDenseReversed(ro,rd,a),vec4(1)); 1
9.400000035762787,27.600000023841858,250.29999995231628 results+=dot(DCsusRDenseUnrolled(ro,rd,a),vec4(1)); 1
7.099999964237213,12.800000011920929,83.60000002384186,805.8000000119209 results+=susRDenseUnrolled(pos); 1
163.10000002384186 results+=susMUnrolled(pos); 1
75.59999996423721,291.80000001192093 results+=susRUnrolled(pos); 1
71.90000003576279,307.5 results+=susRUnrolledReversed(pos); 1
7,12.599999964237213,83.19999998807907,796.8000000119209 results+=susRDenseUnrolledReversed(pos); 1
8.399999976158142,27.799999952316284,253.9000000357628 results+=dot(DCsusRDenseUnrolledReversed(ro,rd,a),vec4(1)); 1

"""


import re
header_re = re.compile(r"PC:(\S+)\s+Browser:(\S+)")
run=0
pc=None
browser=None
result=[]
for line in tests.split("\n"):
    if not line:
        pc=None
        browser=None
        continue
    m = header_re.match(line)
    if m:
        pc, browser = m.groups()
        run += 1
        continue

    if "results" in line:
        timings,method,useubo=line.strip().split(" ")
        timings=[float(x) for x in timings.split(",")]
        time_per_iter=timings[-1]/(10**(len(timings)-1))
        #print(timings,time_per_iter)
        #exit()
        method='"'+method.removeprefix("results+=").removesuffix(";")+'"'
        result.append([pc,browser,run,method,useubo,time_per_iter])

import pandas as pd
data=pd.DataFrame(result, columns="pc;browser;run;method;useubo;time_per_iter".split(";"))
print(data.groupby(by=["method","useubo"])["time_per_iter"].max().unstack("useubo"))
#data=data[~data['method'].str.contains("Pad")]


def getgroup(method):
    groups={"DCsus":"DCsus","DCrow":"DCrow","sus":"sus","row":"row","DChorner":"DCrow","horner":"row"}
    for k,v in groups.items():
        if k in method:return v
    
data["methodgroup"]=data["method"].apply(getgroup)




"""
print(data
    .groupby(["method", "useubo","browser","pc","methodgroup"])["time_per_iter"]
    #.agg(["min", "max"])
    .min()
    .unstack(["browser","pc"])
    .to_string())
print(
    data
    .groupby(["methodgroup", "method", "useubo", "browser", "pc"])["time_per_iter"]
    .min()
    .reset_index()
    .sort_values(["methodgroup", "time_per_iter"])   # ← key line
    .set_index(["methodgroup", "method", "useubo", "browser", "pc"])["time_per_iter"]
    .unstack(["browser", "pc"])
)"""
    #.swaplevel(axis=1)[[("0","min"), ("0","max"), ("1","min"), ("1","max") ]] )
"""print(data
    .groupby(["method", "useubo"])["time_per_iter"]
    .agg(["min", "max"])
    .unstack("useubo")
    .swaplevel(axis=1)[[("0","min"), ("0","max"), ("1","min"), ("1","max") ]] )
print(data.pivot_table(
    index=["pc", "browser", "run", "method"],
    columns="useubo",
    values="time_per_iter",
    aggfunc="max"
))"""


# make sure 'method' is string
data["method"] = data["method"].astype(str)

# make sure 'useubo' is boolean
data["useubo"] = data["useubo"].astype(int).astype(bool)

# create flattened method
data["method_full"] = data["method"] + data["useubo"].map({True: "_ubo", False: ""})

#print(data.to_string())
# group, compute min, unstack
result = (
    data
    .groupby(["methodgroup", "method_full", "browser", "pc"])["time_per_iter"]
    .min()
    .unstack(["browser", "pc"])
)
#print(result.to_string())
# compute best time across browsers per row
result["_max"] = result.max(axis=1)
print(result.to_string())
# sort by methodgroup and fastest time inside each group
result = result.sort_values(["methodgroup", "_max"]).drop(columns="_max")

print(result.to_string())
latex_table = result.to_latex(
    float_format="%.3e",   # wissenschaftliche Notation
    multirow=True,
    multicolumn=True,
    bold_rows=True
)

print(latex_table)