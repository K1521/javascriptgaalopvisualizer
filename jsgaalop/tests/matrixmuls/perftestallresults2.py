tests="""
PC:Akoya Browser:Firefox
5,6,14,70,657 results+=horner(a.x,coeffs); 0
4,6,25,212 results+=rowM(pos); 0
4,4,17,124 results+=rowMDense(pos); 0
45,414 results+=susR(pos); 0
66,631 results+=susM(pos); 0
22,179 results+=susMDense(pos); 0
66,630 results+=susMPad(pos); 0
5,6,20,152 results+=dot(DChorner(a,coeffs),vec4(1)); 0
5,12,72,690 results+=dot(DCrowM(ro,rd,a),vec4(1)); 0
4,12,72,686 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 0
45,421 results+=dot(DCsusR(ro,rd,a),vec4(1)); 0
65,630 results+=dot(DCsusM(ro,rd,a),vec4(1)); 0
24,178 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 0
66,630 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 0
5,11,72,690 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 0
5,5,26,212 results+=rowCopy(c,pos); 0
4,5,17,125 results+=rowCopyDense(cDense,pos); 0
4,5,17,124 results+=rowCopyDenseUnrolled(cDense,pos); 0
15,114 results+=susRDense(pos); 0
99,962 results+=dot(DCsusRDense(ro,rd,a),vec4(1)); 0
41,382 results+=dot(DCsusMDense2(ro,rd,a),vec4(1)); 0
18,114 results+=susRDense(pos); 0
117 results+=dot(DCsusRDenseReversed(ro,rd,a),vec4(1)); 0
6,27,235 results+=dot(DCsusRDenseUnrolled(ro,rd,a),vec4(1)); 0
6,12,83,800 results+=susRDenseUnrolled(pos); 0
8,38,350 results+=susMUnrolled(pos); 0
9,22,139 results+=susRUnrolled(pos); 0
6,18,139 results+=susRUnrolledReversed(pos); 0
5,12,83,801 results+=susRDenseUnrolledReversed(pos); 0
7,32,239 results+=dot(DCsusRDenseUnrolledReversed(ro,rd,a),vec4(1)); 0
119 results+=susMflat(pos); 0
7,32,235 results+=dot(DCsusRUnrolled(ro,rd,a),vec4(1)); 0
6,30,234 results+=dot(DCsusMDenseUnrolled(ro,rd,a),vec4(1)); 0
6,27,233 results+=dot(DCsusMDenseUnrolled2(ro,rd,a),vec4(1)); 0
7,7,13,66,625 results+=horner(a.x,coeffs); 1
6,6,26,217 results+=rowM(pos); 1
6,6,17,130 results+=rowMDense(pos); 1
39,355 results+=susR(pos); 1
29,241 results+=susM(pos); 1
12,86,828 results+=susMDense(pos); 1
29,250 results+=susMPad(pos); 1
6,7,22,139 results+=dot(DChorner(a,coeffs),vec4(1)); 1
8,11,75,711 results+=dot(DCrowM(ro,rd,a),vec4(1)); 1
8,11,73,700 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 1
39,340 results+=dot(DCsusR(ro,rd,a),vec4(1)); 1
26,231 results+=dot(DCsusM(ro,rd,a),vec4(1)); 1
16,106 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 1
28,235 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 1
8,12,75,709 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 1
7,6,26,216 results+=rowCopy(c,pos); 1
7,7,17,130 results+=rowCopyDense(cDense,pos); 1
7,7,17,130 results+=rowCopyDenseUnrolled(cDense,pos); 1
15,113 results+=susRDense(pos); 1
92,889 results+=dot(DCsusRDense(ro,rd,a),vec4(1)); 1
20,154 results+=dot(DCsusMDense2(ro,rd,a),vec4(1)); 1
15,113 results+=susRDense(pos); 1
105 results+=dot(DCsusRDenseReversed(ro,rd,a),vec4(1)); 1
10,34,251 results+=dot(DCsusRDenseUnrolled(ro,rd,a),vec4(1)); 1
9,13,85,807 results+=susRDenseUnrolled(pos); 1
177 results+=susMUnrolled(pos); 1
72,287 results+=susRUnrolled(pos); 1
72,291 results+=susRUnrolledReversed(pos); 1
9,14,84,799 results+=susRDenseUnrolledReversed(pos); 1
8,29,256 results+=dot(DCsusRDenseUnrolledReversed(ro,rd,a),vec4(1)); 1
126 results+=susMflat(pos); 1
78,302 results+=dot(DCsusRUnrolled(ro,rd,a),vec4(1)); 1
12,31,269 results+=dot(DCsusMDenseUnrolled(ro,rd,a),vec4(1)); 1
13,33,283 results+=dot(DCsusMDenseUnrolled2(ro,rd,a),vec4(1)); 1


PC:Akoya Browser:Edge
4.200000047683716,4.8999998569488525,13.599999904632568,68.09999990463257,653.7000000476837 results+=horner(a.x,coeffs); 0
3.299999952316284,4.099999904632568,23.5,211.19999980926514 results+=rowM(pos); 0
2.6999998092651367,4,14.799999952316284,123 results+=rowMDense(pos); 0
17.200000047683716,142.40000009536743 results+=susR(pos); 0
6.799999952316284,36.80000019073486,348.89999985694885 results+=susM(pos); 0
4.299999952316284,16.899999856948853,133.20000004768372 results+=susMDense(pos); 0
39.799999952316284,378.60000014305115 results+=susMPad(pos); 0
3.5,4.599999904632568,19.299999952316284,172 results+=dot(DChorner(a,coeffs),vec4(1)); 0
3,9.400000095367432,70.5,689.2999999523163 results+=dot(DCrowM(ro,rd,a),vec4(1)); 0
3.5,9.200000047683716,70.59999990463257,684.6999998092651 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 0
17.200000047683716,143.10000014305115 results+=dot(DCsusR(ro,rd,a),vec4(1)); 0
6.900000095367432,45.60000014305115,434 results+=dot(DCsusM(ro,rd,a),vec4(1)); 0
15.899999856948853,120.69999980926514 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 0
39.5,378 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 0
3.6000001430511475,9.900000095367432,70.70000004768372,689.1000001430511 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 0
3.0999999046325684,4.700000047683716,22.799999952316284,210.79999995231628 results+=rowCopy(c,pos); 0
3.5,3.1999998092651367,14.599999904632568,123.09999990463257 results+=rowCopyDense(cDense,pos); 0
3.299999952316284,3.299999952316284,14.900000095367432,122.79999995231628 results+=rowCopyDenseUnrolled(cDense,pos); 0
11.600000143051147,91.89999985694885,895.3999998569489 results+=susRDense(pos); 0
97.19999980926514,1981.7999999523163 results+=dot(DCsusRDense(ro,rd,a),vec4(1)); 0
33.19999980926514,314.7999999523163 results+=dot(DCsusMDense2(ro,rd,a),vec4(1)); 0
11.200000047683716,91.70000004768372,895.6999998092651 results+=susRDense(pos); 0
105.19999980926514 results+=dot(DCsusRDenseReversed(ro,rd,a),vec4(1)); 0
4.700000047683716,25.199999809265137,233.19999980926514 results+=dot(DCsusRDenseUnrolled(ro,rd,a),vec4(1)); 0
3.8999998569488525,10.400000095367432,81.70000004768372,799 results+=susRDenseUnrolled(pos); 0
6.699999809265137,36.69999980926514,349.2999999523163 results+=susMUnrolled(pos); 0
4.299999952316284,15.5,136.5 results+=susRUnrolled(pos); 0
4.299999952316284,15.599999904632568,138.60000014305115 results+=susRUnrolledReversed(pos); 0
4.099999904632568,11.100000143051147,81.70000004768372,798.9000000953674 results+=susRDenseUnrolledReversed(pos); 0
5.5,26.200000047683716,237.59999990463257 results+=dot(DCsusRDenseUnrolledReversed(ro,rd,a),vec4(1)); 0
95.30000019073486,1963 results+=susMflat(pos); 0
5.599999904632568,25.200000047683716,233.79999995231628 results+=dot(DCsusRUnrolled(ro,rd,a),vec4(1)); 0
5.1000001430511475,25.59999990463257,233 results+=dot(DCsusMDenseUnrolled(ro,rd,a),vec4(1)); 0
5.5,24.700000047683716,231.29999995231628 results+=dot(DCsusMDenseUnrolled2(ro,rd,a),vec4(1)); 0
6.099999904632568,6,10.199999809265137,65.09999990463257,621.5999999046326 results+=horner(a.x,coeffs); 1
5.599999904632568,6.200000047683716,23.799999952316284,214.89999985694885 results+=rowM(pos); 1
5.5,5.299999952316284,16.699999809265137,129.20000004768372 results+=rowMDense(pos); 1
18.5,174 results+=susR(pos); 1
25.899999856948853,238.89999985694885 results+=susM(pos); 1
10.899999856948853,73.79999995231628,714.9000000953674 results+=susMDense(pos); 1
27,244.69999980926514 results+=susMPad(pos); 1
6.099999904632568,6,18,137.90000009536743 results+=dot(DChorner(a,coeffs),vec4(1)); 1
6.1000001430511475,9.899999856948853,73.09999990463257,709.1000001430511 results+=dot(DCrowM(ro,rd,a),vec4(1)); 1
5.5,10,71.89999985694885,699.3999998569489 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 1
18.40000009536743,160.5 results+=dot(DCsusR(ro,rd,a),vec4(1)); 1
25.399999856948853,226.80000019073486 results+=dot(DCsusM(ro,rd,a),vec4(1)); 1
11.700000047683716,96.20000004768372,943.9000000953674 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 1
26.299999952316284,231.70000004768372 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 1
5.299999952316284,9.900000095367432,72.89999985694885,709.2000000476837 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 1
5.5,5.599999904632568,24.100000143051147,215.5 results+=rowCopy(c,pos); 1
5.800000190734863,6,17.59999990463257,129.5 results+=rowCopyDense(cDense,pos); 1
5.599999904632568,6,17.100000143051147,129.59999990463257 results+=rowCopyDenseUnrolled(cDense,pos); 1
11.399999856948853,85.39999985694885,834.7999999523163 results+=susRDense(pos); 1
94.39999985694885,990.7000000476837 results+=dot(DCsusRDense(ro,rd,a),vec4(1)); 1
19.299999952316284,138.09999990463257 results+=dot(DCsusMDense2(ro,rd,a),vec4(1)); 1
11,85.20000004768372,831.4000000953674 results+=susRDense(pos); 1
100.60000014305115 results+=dot(DCsusRDenseReversed(ro,rd,a),vec4(1)); 1
11.299999952316284,31,253.79999995231628 results+=dot(DCsusRDenseUnrolled(ro,rd,a),vec4(1)); 1
7.799999952316284,13.200000047683716,86.5,806.2000000476837 results+=susRDenseUnrolled(pos); 1
166.40000009536743 results+=susMUnrolled(pos); 1
74.5,297.59999990463257 results+=susRUnrolled(pos); 1
71.29999995231628,291.09999990463257 results+=susRUnrolledReversed(pos); 1
7.799999952316284,12.5,82.89999985694885,797 results+=susRDenseUnrolledReversed(pos); 1
8,28.399999856948853,257.09999990463257 results+=dot(DCsusRDenseUnrolledReversed(ro,rd,a),vec4(1)); 1
97.79999995231628,1981.2000000476837 results+=susMflat(pos); 1
77.09999990463257,309.40000009536743 results+=dot(DCsusRUnrolled(ro,rd,a),vec4(1)); 1
14.399999856948853,30.200000047683716,267.69999980926514 results+=dot(DCsusMDenseUnrolled(ro,rd,a),vec4(1)); 1
13.5,31.299999952316284,282.59999990463257 results+=dot(DCsusMDenseUnrolled2(ro,rd,a),vec4(1)); 1
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
        method=method.removeprefix("results+=").removesuffix(";")
        method=method.removeprefix("dot(").removesuffix("vec4(1))")
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
print(result.to_csv())