// Test para verificar variables de entorno en Next.js
console.log("\n=== Variables de Entorno Firebase ===\n");
console.log(
  "FIREBASE_PROJECT_ID:",
  process.env.FIREBASE_PROJECT_ID || "❌ NO DEFINIDA"
);
console.log(
  "FIREBASE_CLIENT_EMAIL:",
  process.env.FIREBASE_CLIENT_EMAIL || "❌ NO DEFINIDA"
);
console.log(
  "FIREBASE_PRIVATE_KEY:",
  process.env.FIREBASE_PRIVATE_KEY ? "✅ DEFINIDA" : "❌ NO DEFINIDA"
);
console.log(
  "\nNEXT_PUBLIC_SITE_URL:",
  process.env.NEXT_PUBLIC_SITE_URL || "❌ NO DEFINIDA"
);
console.log("\n=== Todas las variables disponibles ===\n");
console.log(
  Object.keys(process.env)
    .filter((k) => k.includes("FIREBASE") || k.includes("NEXT"))
    .join("\n")
);
