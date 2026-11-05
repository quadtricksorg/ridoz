import sharp from 'sharp';
import fs from 'fs';

async function testSharp() {
  const metaTrunk = await sharp('src/assets/c-trunk.png').metadata();
  console.log('c-trunk metadata:', metaTrunk.width, metaTrunk.height, metaTrunk.format, metaTrunk.channels);

  const metaPanty = await sharp('src/assets/c-panty.png').metadata();
  console.log('c-panty metadata:', metaPanty.width, metaPanty.height, metaPanty.format, metaPanty.channels);

  const metaBrief = await sharp('src/assets/c-brief.png').metadata();
  console.log('c-brief metadata:', metaBrief.width, metaBrief.height, metaBrief.format, metaBrief.channels);

  const metaBra = await sharp('src/assets/showcase/design1.png').metadata();
  console.log('design1 metadata:', metaBra.width, metaBra.height, metaBra.format, metaBra.channels);
}

testSharp().catch(console.error);

