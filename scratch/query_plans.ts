import { db } from '../lib/db'

async function main() {
  const tiers = await db.pricingTier.findMany({
    include: {
      labels: { where: { locale: 'es' } }
    }
  })
  
  console.log("TIERS (ES):")
  for (const t of tiers) {
    console.log(`- Tier ID: ${t.id}, SortOrder: ${t.sortOrder}, Label: ${t.labels[0]?.name}`)
  }

  const modules = await db.pageModule.findMany()
  console.log("\nMODULES:")
  for (const m of modules) {
    console.log(`- Module ID: ${m.id}, Vis: ${m.isVisible_es}, Sort: ${m.sortOrder_es}`)
  }
  
  const contents = await db.moduleContent.findMany({
    where: { locale: 'es' }
  })
  console.log("\nMODULE CONTENTS (ES) containing 'Prueba':")
  for (const c of contents) {
    if (c.value.toLowerCase().includes('prueba') || c.key.toLowerCase().includes('prueba') || c.moduleId.toLowerCase().includes('trial')) {
      console.log(`- Module: ${c.moduleId}, Key: ${c.key}, Value: ${c.value}`)
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => db.$disconnect())
