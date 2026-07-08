const fs = require('fs');
const path = require('path');

const files = [
  { name: 'NosServices.tsx', moduleId: 'nos_services' },
  { name: 'ContentShowcase.tsx', moduleId: 'content' },
  { name: 'SportsMarquee.tsx', moduleId: 'sports_marquee' },
  { name: 'MoviesMarquee.tsx', moduleId: 'movies_marquee' },
  { name: 'SeriesMarquee.tsx', moduleId: 'series_marquee' },
  { name: 'DevicesSection.tsx', moduleId: 'devices' },
  { name: 'TestimonialsSection.tsx', moduleId: 'testimonials' },
  { name: 'TemoignagesCarousel.tsx', moduleId: 'temoignages' },
  { name: 'FaqSection.tsx', moduleId: 'faq' },
  { name: 'FaqSectionClient.tsx', moduleId: 'faq', isClientOnly: true },
  { name: 'AffiliateLinksSection.tsx', moduleId: 'affiliate_links' },
  { name: 'TrialCta.tsx', moduleId: 'trial_cta' },
  { name: 'PlansCta.tsx', moduleId: 'plans_cta' }
];

const componentsDir = path.join(__dirname, '..', 'components', 'frontend');

files.forEach(f => {
  const filePath = path.join(componentsDir, f.name);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  if (f.isClientOnly) {
    // Only adjust badge ID
    content = content.replace(
      new RegExp(`id="${f.moduleId}"\\s+className="badge-anchor"`, 'g'),
      'className="badge-anchor"'
    );
  } else {
    // 1. Restore outer ModuleBgWrapper ID
    if (!content.includes(`id="${f.moduleId}"`)) {
      content = content.replace(
        new RegExp(`<ModuleBgWrapper\\s+moduleId="${f.moduleId}"`, 'g'),
        `<ModuleBgWrapper id="${f.moduleId}" moduleId="${f.moduleId}"`
      );
    }
    // 2. Remove badge ID
    content = content.replace(
      new RegExp(`id="${f.moduleId}"\\s+className="badge-anchor"`, 'g'),
      'className="badge-anchor"'
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully processed: ${f.name}`);
});
