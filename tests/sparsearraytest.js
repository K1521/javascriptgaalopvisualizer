
function benchmark(label, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  
  const N = 100_000;
  const SPACING = 1000;
  const KEYS = Array.from({ length: N / SPACING }, (_, i) => i * SPACING);
  
  // === Sparse Array Test ===

  for (let i=0;i<10;i++){
  const sparseArray = [];
  
  benchmark("Sparse Array - insert", () => {
    for (const key of KEYS) {
      sparseArray[key] = key * 2;
    }
  });
  
  benchmark("Sparse Array - access", () => {
    let sum = 0;
    for (const key of KEYS) {
      sum += sparseArray[key];
    }
    return sum;
  });
  
  // === Map Test ===
  const map = new Map();
  
  benchmark("Map - insert", () => {
    for (const key of KEYS) {
      map.set(key, key * 2);
    }
  });
  
  benchmark("Map - access", () => {
    let sum = 0;
    for (const key of KEYS) {
      sum += map.get(key);
    }
    return sum;
  });
}