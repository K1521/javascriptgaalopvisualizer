tests="""
PC:Akoya Browser:Firefox
5,5,14,69,657 results+=horner(a.x,coeffs); 0
5,5,25,212 results+=rowM(pos); 0
3,4,16,124 results+=rowMDense(pos); 0
45,415 results+=susR(pos); 0
66,630 results+=susM(pos); 0
23,179 results+=susMDense(pos); 0
66,630 results+=susMPad(pos); 0
5,5,22,153 results+=dot(DChorner(a,coeffs),vec4(1)); 0
4,10,72,690 results+=dot(DCrowM(ro,rd,a),vec4(1)); 0
4,10,71,685 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 0
45,420 results+=dot(DCsusR(ro,rd,a),vec4(1)); 0
65,630 results+=dot(DCsusM(ro,rd,a),vec4(1)); 0
22,178 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 0
66,630 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 0
8,7,11,66,624 results+=horner(a.x,coeffs); 1
6,7,26,216 results+=rowM(pos); 1
6,6,17,130 results+=rowMDense(pos); 1
39,355 results+=susR(pos); 1
27,241 results+=susM(pos); 1
13,86,827 results+=susMDense(pos); 1
30,249 results+=susMPad(pos); 1
6,6,21,139 results+=dot(DChorner(a,coeffs),vec4(1)); 1
6,11,74,710 results+=dot(DCrowM(ro,rd,a),vec4(1)); 1
7,11,73,700 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 1
41,340 results+=dot(DCsusR(ro,rd,a),vec4(1)); 1
28,231 results+=dot(DCsusM(ro,rd,a),vec4(1)); 1
14,107 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 1
26,236 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 1

PC:Akoya Browser:Firefox
5,5,14,69,657 results+=horner(a.x,coeffs); 0
4,6,25,212 results+=rowM(pos); 0
4,4,15,125 results+=rowMDense(pos); 0
45,415 results+=susR(pos); 0
66,630 results+=susM(pos); 0
22,179 results+=susMDense(pos); 0
66,629 results+=susMPad(pos); 0
5,5,20,152 results+=dot(DChorner(a,coeffs),vec4(1)); 0
4,10,72,690 results+=dot(DCrowM(ro,rd,a),vec4(1)); 0
5,10,72,696 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 0
45,420 results+=dot(DCsusR(ro,rd,a),vec4(1)); 0
66,630 results+=dot(DCsusM(ro,rd,a),vec4(1)); 0
22,179 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 0
66,630 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 0
8,7,12,66,624 results+=horner(a.x,coeffs); 1
6,6,26,216 results+=rowM(pos); 1
7,6,17,130 results+=rowMDense(pos); 1
39,355 results+=susR(pos); 1
28,241 results+=susM(pos); 1
12,86,827 results+=susMDense(pos); 1
29,249 results+=susMPad(pos); 1
7,7,21,139 results+=dot(DChorner(a,coeffs),vec4(1)); 1
7,11,74,711 results+=dot(DCrowM(ro,rd,a),vec4(1)); 1
6,11,75,719 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 1
37,340 results+=dot(DCsusR(ro,rd,a),vec4(1)); 1
27,234 results+=dot(DCsusM(ro,rd,a),vec4(1)); 1
13,102 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 1
29,236 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 1

PC:Akoya Browser:Edge
3.100000023841858,3.800000011920929,13,68.09999996423721,654.1999999880791 results+=horner(a.x,coeffs); 0
2.799999952316284,4,23.400000035762787,210.69999998807907 results+=rowM(pos); 0
3.5,3.099999964237213,14.599999964237213,122.59999996423721 results+=rowMDense(pos); 0
16.100000023841858,142.5 results+=susR(pos); 0
5.899999976158142,36.59999996423721,348.30000001192093 results+=susM(pos); 0
3.199999988079071,16.19999998807907,133.19999998807907 results+=susMDense(pos); 0
39.69999998807907,378.19999998807907 results+=susMPad(pos); 0
3.399999976158142,4.199999988079071,19.899999976158142,172.10000002384186 results+=dot(DChorner(a,coeffs),vec4(1)); 0
2.799999952316284,8.899999976158142,70.69999998807907,688.5 results+=dot(DCrowM(ro,rd,a),vec4(1)); 0
2.5,9.199999988079071,69.89999997615814,684.3000000119209 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 0
17.799999952316284,142.5 results+=dot(DCsusR(ro,rd,a),vec4(1)); 0
7.100000023841858,45.10000002384186,435.0999999642372 results+=dot(DCsusM(ro,rd,a),vec4(1)); 0
13.699999988079071,120.59999996423721 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 0
39.89999997615814,378 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 0
5.699999988079071,5,10.099999964237213,64.5,620.5 results+=horner(a.x,coeffs); 1
5.599999964237213,5,23.69999998807907,214.89999997615814 results+=rowM(pos); 1
4.599999964237213,4.900000035762787,15.300000011920929,128.5 results+=rowMDense(pos); 1
19.80000001192093,173.79999995231628 results+=susR(pos); 1
26.19999998807907,238.69999998807907 results+=susM(pos); 1
10.199999988079071,74.29999995231628,714.6000000238419 results+=susMDense(pos); 1
26.799999952316284,244.80000001192093 results+=susMPad(pos); 1
6.199999988079071,5.899999976158142,17.80000001192093,137.30000001192093 results+=dot(DChorner(a,coeffs),vec4(1)); 1
5.299999952316284,9.800000011920929,73.30000001192093,708.8999999761581 results+=dot(DCrowM(ro,rd,a),vec4(1)); 1
4.400000035762787,9,71.59999996423721,698.8999999761581 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 1
21.5,160.5 results+=dot(DCsusR(ro,rd,a),vec4(1)); 1
25.100000023841858,226.5 results+=dot(DCsusM(ro,rd,a),vec4(1)); 1
12,96,946.0999999642372 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 1
25.600000023841858,231.69999998807907 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 1

PC:Akoya Browser:Edge
3.899999976158142,4,13,68.19999998807907,654 results+=horner(a.x,coeffs); 0
3.399999976158142,4,23.400000035762787,210.5999999642372 results+=rowM(pos); 0
2.5,2.900000035762787,14.299999952316284,122.89999997615814 results+=rowMDense(pos); 0
16.5,142.30000001192093 results+=susR(pos); 0
6.300000011920929,36.60000002384186,348.2999999523163 results+=susM(pos); 0
3.399999976158142,15,133.5999999642372 results+=susMDense(pos); 0
40,378.39999997615814 results+=susMPad(pos); 0
3.199999988079071,4,19.599999964237213,171.9000000357628 results+=dot(DChorner(a,coeffs),vec4(1)); 0
2.599999964237213,9.800000011920929,70.89999997615814,688.8999999761581 results+=dot(DCrowM(ro,rd,a),vec4(1)); 0
3.199999988079071,8.699999988079071,70.30000001192093,684.3000000119209 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 0
16.30000001192093,143.39999997615814 results+=dot(DCsusR(ro,rd,a),vec4(1)); 0
7.399999976158142,45.30000001192093,434.30000001192093 results+=dot(DCsusM(ro,rd,a),vec4(1)); 0
13.800000011920929,120.80000001192093 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 0
40,378 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 0
5.099999964237213,5,9.300000011920929,64.5,620.6999999880791 results+=horner(a.x,coeffs); 1
5.699999988079071,4.800000011920929,24.099999964237213,215.5999999642372 results+=rowM(pos); 1
4.799999952316284,4.800000011920929,15.700000047683716,128.5999999642372 results+=rowMDense(pos); 1
18.80000001192093,173.89999997615814 results+=susR(pos); 1
26,238.89999997615814 results+=susM(pos); 1
9.699999988079071,73.60000002384186,714.5 results+=susMDense(pos); 1
26.599999964237213,244.69999998807907 results+=susMPad(pos); 1
5.400000035762787,4.899999976158142,17.599999964237213,137.5 results+=dot(DChorner(a,coeffs),vec4(1)); 1
5.5,9.399999976158142,73.19999998807907,708.8999999761581 results+=dot(DCrowM(ro,rd,a),vec4(1)); 1
4.800000011920929,9.399999976158142,72.09999996423721,698.8999999761581 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 1
18.30000001192093,160.89999997615814 results+=dot(DCsusR(ro,rd,a),vec4(1)); 1
25.5,226.30000001192093 results+=dot(DCsusM(ro,rd,a),vec4(1)); 1
12.300000011920929,96.69999998807907,945.8000000119209 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 1
25.099999964237213,231.60000002384186 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 1

PC:Akoya Browser:Firefox
6,5,15,70,657 results+=horner(a.x,coeffs); 0
4,6,26,211 results+=rowM(pos); 0
4,4,16,124 results+=rowMDense(pos); 0
45,415 results+=susR(pos); 0
66,630 results+=susM(pos); 0
21,179 results+=susMDense(pos); 0
66,630 results+=susMPad(pos); 0
6,6,20,152 results+=dot(DChorner(a,coeffs),vec4(1)); 0
5,11,72,690 results+=dot(DCrowM(ro,rd,a),vec4(1)); 0
4,11,71,685 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 0
45,420 results+=dot(DCsusR(ro,rd,a),vec4(1)); 0
66,630 results+=dot(DCsusM(ro,rd,a),vec4(1)); 0
22,179 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 0
66,630 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 0
5,11,72,690 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 0
5,5,26,212 results+=rowCopy(c,pos); 0
4,5,16,124 results+=rowCopyDense(cDense,pos); 0
4,4,16,124 results+=rowCopyDenseUnrolled(cDense,pos); 0
19,153 results+=susRDense(pos); 0
197 results+=dot(DCsusRDense(ro,rd,a),vec4(1)); 0
8,6,11,66,624 results+=horner(a.x,coeffs); 1
6,6,26,216 results+=rowM(pos); 1
6,6,16,130 results+=rowMDense(pos); 1
38,354 results+=susR(pos); 1
28,241 results+=susM(pos); 1
12,86,826 results+=susMDense(pos); 1
28,250 results+=susMPad(pos); 1
7,7,20,138 results+=dot(DChorner(a,coeffs),vec4(1)); 1
8,11,75,710 results+=dot(DCrowM(ro,rd,a),vec4(1)); 1
7,10,73,700 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 1
40,340 results+=dot(DCsusR(ro,rd,a),vec4(1)); 1
28,231 results+=dot(DCsusM(ro,rd,a),vec4(1)); 1
15,106 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 1
28,236 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 1
7,11,75,710 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 1
6,7,26,216 results+=rowCopy(c,pos); 1
6,6,18,131 results+=rowCopyDense(cDense,pos); 1
7,6,16,130 results+=rowCopyDenseUnrolled(cDense,pos); 1
19,162 results+=susRDense(pos); 1
176 results+=dot(DCsusRDense(ro,rd,a),vec4(1)); 1

PC:Akoya Browser:Edge
3.8999999910593033,4,13.099999994039536,68.09999999403954,653.2999999970198 results+=horner(a.x,coeffs); 0
2.5999999940395355,3.5,23.399999991059303,210.70000000298023 results+=rowM(pos); 0
2.1000000089406967,3,14,122.79999999701977 results+=rowMDense(pos); 0
16.599999994039536,143.1000000089407 results+=susR(pos); 0
6.5999999940395355,36.79999999701977,348.5 results+=susM(pos); 0
4.0999999940395355,15.799999997019768,133 results+=susMDense(pos); 0
40,378.59999999403954 results+=susMPad(pos); 0
3.0999999940395355,4.0999999940395355,19.899999991059303,171.59999999403954 results+=dot(DChorner(a,coeffs),vec4(1)); 0
3.199999988079071,8.700000002980232,70.70000000298023,688.6000000089407 results+=dot(DCrowM(ro,rd,a),vec4(1)); 0
3.0999999940395355,9.599999994039536,70,684.1999999880791 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 0
17.100000008940697,143 results+=dot(DCsusR(ro,rd,a),vec4(1)); 0
7.299999997019768,45.599999994039536,434.69999998807907 results+=dot(DCsusM(ro,rd,a),vec4(1)); 0
14.899999991059303,121 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 0
39.79999999701977,378.5 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 0
2.8999999910593033,9.099999994039536,70.70000000298023,688.8999999910593 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 0
3.2000000029802322,3.8999999910593033,23.399999991059303,210.59999999403954 results+=rowCopy(c,pos); 0
2.300000011920929,3.5,14.799999997019768,122.8999999910593 results+=rowCopyDense(cDense,pos); 0
2.800000011920929,2.7999999970197678,14.600000008940697,122.70000000298023 results+=rowCopyDenseUnrolled(cDense,pos); 0
7.9000000059604645,62.70000000298023,611 results+=susRDense(pos); 0
177.3999999910593 results+=dot(DCsusRDense(ro,rd,a),vec4(1)); 0
5.700000002980232,4.799999997019768,9.900000005960464,64.6000000089407,621.2999999970198 results+=horner(a.x,coeffs); 1
4.699999988079071,5.0999999940395355,23.200000002980232,215.29999999701977 results+=rowM(pos); 1
4.200000002980232,5,14.5,129.09999999403954 results+=rowMDense(pos); 1
19.099999994039536,173.8999999910593 results+=susR(pos); 1
26.099999994039536,239.09999999403954 results+=susM(pos); 1
9.700000002980232,74.20000000298023,714.2999999970198 results+=susMDense(pos); 1
26.700000002980232,244.70000000298023 results+=susMPad(pos); 1
5.799999997019768,4.9000000059604645,18,137.5 results+=dot(DChorner(a,coeffs),vec4(1)); 1
5.799999997019768,9.100000008940697,73.5,708.5999999940395 results+=dot(DCrowM(ro,rd,a),vec4(1)); 1
5.299999997019768,9.600000008940697,72.20000000298023,699.0999999940395 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 1
18.599999994039536,160.40000000596046 results+=dot(DCsusR(ro,rd,a),vec4(1)); 1
25.5,226.29999999701977 results+=dot(DCsusM(ro,rd,a),vec4(1)); 1
12.299999997019768,96.5,1946.2999999970198 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 1
25.399999991059303,231.5 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 1
5.799999997019768,10.100000008940697,73.30000001192093,709 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 1
5.299999997019768,5.200000002980232,23.5,215.3999999910593 results+=rowCopy(c,pos); 1
4.800000011920929,5.0999999940395355,14.700000002980232,129.19999998807907 results+=rowCopyDense(cDense,pos); 1
5.0999999940395355,5.199999988079071,14.700000002980232,129.19999998807907 results+=rowCopyDenseUnrolled(cDense,pos); 1
8,67.3999999910593,650 results+=susRDense(pos); 1
168.69999998807907 results+=dot(DCsusRDense(ro,rd,a),vec4(1)); 1

PC:Medionmit1080 Browser:Firefox
3,2,2,2,11,73,750 results+=horner(a.x,coeffs); 0
2,2,2,8,57,589 results+=rowM(pos); 0
2,2,2,8,60,604 results+=rowMDense(pos); 0
3,8,61,617 results+=susR(pos); 0
2,3,14,133 results+=susM(pos); 0
2,6,41,360 results+=susMDense(pos); 0
3,4,17,174 results+=susMPad(pos); 0
2,2,2,6,38,372 results+=dot(DChorner(a,coeffs),vec4(1)); 0
2,2,5,32,307 results+=dot(DCrowM(ro,rd,a),vec4(1)); 0
2,2,5,32,306 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 0
4,15,130 results+=dot(DCsusR(ro,rd,a),vec4(1)); 0
7,38,234 results+=dot(DCsusM(ro,rd,a),vec4(1)); 0
5,21,128 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 0
4,31,268 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 0
2,2,5,32,306 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 0
2,1,3,8,58,590 results+=rowCopy(c,pos); 0
2,2,2,8,60,605 results+=rowCopyDense(cDense,pos); 0
2,2,2,8,61,603 results+=rowCopyDenseUnrolled(cDense,pos); 0
2,6,38,398 results+=susRDense(pos); 0
11,84,812 results+=dot(DCsusRDense(ro,rd,a),vec4(1)); 0
2,2,2,3,10,77,774 results+=horner(a.x,coeffs); 1
2,2,2,8,60,615 results+=rowM(pos); 1
2,2,3,8,61,614 results+=rowMDense(pos); 1
3,12,102 results+=susR(pos); 1
7,22,186 results+=susM(pos); 1
2,7,51,483 results+=susMDense(pos); 1
7,23,185 results+=susMPad(pos); 1
2,2,2,5,38,374 results+=dot(DChorner(a,coeffs),vec4(1)); 1
2,3,5,31,312 results+=dot(DCrowM(ro,rd,a),vec4(1)); 1
2,2,5,32,313 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 1
4,26,248 results+=dot(DCsusR(ro,rd,a),vec4(1)); 1
3,12,96,959 results+=dot(DCsusM(ro,rd,a),vec4(1)); 1
2,7,50,492 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 1
3,12,96,938 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 1
2,3,5,34,312 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 1
2,2,3,8,60,619 results+=rowCopy(c,pos); 1
2,2,2,8,61,621 results+=rowCopyDense(cDense,pos); 1
2,2,2,8,61,622 results+=rowCopyDenseUnrolled(cDense,pos); 1
3,10,75,723 results+=susRDense(pos); 1
12,97,930 results+=dot(DCsusRDense(ro,rd,a),vec4(1)); 1


PC:Medionmit1080 Browser:Edge
3.5,3.5,3.5,2.2999999999883585,10,73.79999999998836,729 results+=horner(a.x,coeffs); 0
1.1000000000349246,1.1999999999534339,1.3999999999650754,6.600000000034925,55.100000000034925,547 results+=rowM(pos); 0
1,1,1.3999999999650754,6.699999999953434,58.5,579.2999999999884 results+=rowMDense(pos); 0
1.5,4.2000000000116415,30.900000000023283,337.70000000001164 results+=susR(pos); 0
1.400000000023283,2.7999999999883585,12.599999999976717,114.39999999996508 results+=susM(pos); 0
1.7000000000116415,5.399999999965075,38,343.20000000001164 results+=susMDense(pos); 0
1.5,3.099999999976717,16.29999999998836,149.29999999998836 results+=susMPad(pos); 0
1.2000000000116415,1.1000000000349246,1.3999999999650754,4.099999999976717,36,352.8999999999651 results+=dot(DChorner(a,coeffs),vec4(1)); 0
1.2000000000116415,1.2999999999883585,4,30.5,300.9000000000233 results+=dot(DCrowM(ro,rd,a),vec4(1)); 0
1,1.5,3.8999999999650754,30.79999999998836,300.4000000000233 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 0
2.2000000000116415,12.400000000023283,116.59999999997672 results+=dot(DCsusR(ro,rd,a),vec4(1)); 0
5.5,39.40000000002328,287.5 results+=dot(DCsusM(ro,rd,a),vec4(1)); 0
3.3999999999650754,19.29999999998836,122.19999999995343 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 0
6.2999999999883585,39.5,271.1000000000349 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 0
1,1.099999999976717,4,30.5,300.9000000000233 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 0
0.9000000000232831,1.1999999999534339,1.5,6.599999999976717,55.199999999953434,550.2999999999884 results+=rowCopy(c,pos); 0
1.1000000000349246,1.2999999999883585,1.5,6.900000000023283,58.5,579.7000000000116 results+=rowCopyDense(cDense,pos); 0
0.8999999999650754,1,1.5,6.899999999965075,58.40000000002328,579.5 results+=rowCopyDenseUnrolled(cDense,pos); 0
1.3999999999650754,4.7999999999883585,36.59999999997672,374.5 results+=susRDense(pos); 0
7.7999999999883585,61.899999999965075,605.5999999999767 results+=dot(DCsusRDense(ro,rd,a),vec4(1)); 0
1,1.099999999976717,1,1.7000000000116415,8.200000000011642,70.69999999995343,707.1000000000349 results+=horner(a.x,coeffs); 1
0.9000000000232831,1,1.2000000000116415,6.7999999999883585,57.5,570.5 results+=rowM(pos); 1
1.2999999999883585,1,1.599999999976717,6.900000000023283,58.79999999998836,589 results+=rowMDense(pos); 1
2.099999999976717,10.900000000023283,98.30000000004657,972.2000000000698 results+=susR(pos); 1
5.300000000046566,21.5,184.19999999995343 results+=susM(pos); 1
1.1000000000931323,5.900000000023283,49.199999999953434,480.79999999993015 results+=susMDense(pos); 1
5.599999999976717,21.300000000046566,184.19999999995343 results+=susMPad(pos); 1
1.099999999976717,1.1999999999534339,1.3000000000465661,4.700000000069849,36,353.79999999993015 results+=dot(DChorner(a,coeffs),vec4(1)); 1
1.099999999976717,1.3999999999068677,3.900000000023283,30.800000000046566,302.5 results+=dot(DCrowM(ro,rd,a),vec4(1)); 1
1,1.1999999999534339,4.199999999953434,30.900000000023283,304.5 results+=dot(DCrowMDense(ro,rd,a),vec4(1)); 1
3.199999999953434,19.400000000023283,181.90000000002328 results+=dot(DCsusR(ro,rd,a),vec4(1)); 1
2,10.399999999906868,93.59999999997672,923.9000000000233 results+=dot(DCsusM(ro,rd,a),vec4(1)); 1
1.599999999976717,5.900000000023283,49.40000000002328,481.5 results+=dot(DCsusMDense(ro,rd,a),vec4(1)); 1
2.099999999976717,10.29999999993015,93.59999999997672,923.9000000000233 results+=dot(DCsusMPad(ro,rd,a),vec4(1)); 1
1.099999999976717,1.5,4.400000000023283,31.099999999976717,302.5 results+=dot(DCrowCopy(c,ro,rd,a),vec4(1)); 1
1.2999999999301508,1.099999999976717,1.7999999999301508,7.199999999953434,57.59999999997672,570 results+=rowCopy(c,pos); 1
1,1.5,1.6999999999534339,7.099999999976717,59.09999999997672,591.0999999999767 results+=rowCopyDense(cDense,pos); 1
1,1.1999999999534339,1.5,7.199999999953434,59.09999999997672,591.2999999999302 results+=rowCopyDenseUnrolled(cDense,pos); 1
1.5,8.300000000046566,74.39999999990687,728.6999999999534 results+=susRDense(pos); 1
9.599999999976717,85.09999999997672,839.5 results+=dot(DCsusRDense(ro,rd,a),vec4(1)); 1
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





print(data
    .groupby(["method", "useubo","browser","pc","methodgroup"])["time_per_iter"]
    #.agg(["min", "max"])
    .min()
    .unstack(["browser","pc"])
    .to_string())
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