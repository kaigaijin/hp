// スポット件数を国別・カテゴリ別にカウント
// 使い方: npx tsx scripts/count-spots.ts

import fs from "fs";
import path from "path";

const DIRECTORY_PATH = path.resolve(__dirname, "../content/directory");

function main() {
  const countries = fs
    .readdirSync(DIRECTORY_PATH)
    .filter((f) =>
      fs.statSync(path.join(DIRECTORY_PATH, f)).isDirectory()
    )
    .sort();

  let grandTotal = 0;
  let withPlaceId = 0;
  let withoutPlaceId = 0;

  for (const country of countries) {
    const countryDir = path.join(DIRECTORY_PATH, country);
    const files = fs
      .readdirSync(countryDir)
      .filter((f) => f.endsWith(".json"))
      .sort();

    let countryTotal = 0;
    let countryWithId = 0;

    for (const file of files) {
      const spots: { place_id?: string }[] = JSON.parse(
        fs.readFileSync(path.join(countryDir, file), "utf-8")
      );
      const hasId = spots.filter((s) => s.place_id).length;
      countryTotal += spots.length;
      countryWithId += hasId;
    }

    console.log(
      `${country.toUpperCase()}: ${countryTotal}件（place_id: ${countryWithId}/${countryTotal}）`
    );
    grandTotal += countryTotal;
    withPlaceId += countryWithId;
    withoutPlaceId += countryTotal - countryWithId;
  }

  console.log(`\n合計: ${grandTotal}件`);
  console.log(`place_idあり: ${withPlaceId} / なし: ${withoutPlaceId}`);
}

main();
