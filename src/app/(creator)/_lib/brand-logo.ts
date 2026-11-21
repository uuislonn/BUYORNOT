// Local copies of the marks published by each brand's official storefront.
const logos = new Map([
  ["oafish", "oafish"],
  ["오피쉬", "oafish"],
  ["오프쉬", "oafish"],
  ["bittercells", "bittercells"],
  ["비터셀즈", "bittercells"],
  ["frizmworks", "frizmworks"],
  ["프리즘웍스", "frizmworks"],
  ["standoil", "standoil"],
  ["스탠드오일", "standoil"],
  ["moodinside", "moodinside"],
  ["무드인사이드", "moodinside"],
  ["nothingwritten", "nothingwritten"],
  ["낫띵리튼", "nothingwritten"],
  ["amomento", "amomento"],
  ["아모멘토", "amomento"],
  ["matinkim", "matinkim"],
  ["마뗑킴", "matinkim"],
  ["deinet", "deinet"],
  ["드네트", "deinet"],
  ["gramicci", "gramicci"],
  ["그라미치", "gramicci"],
  ["prada", "prada"],
  ["프라다", "prada"],
  ["lemaire", "lemaire"],
  ["르메르", "lemaire"],
  ["aakam", "aakam"],
  ["아캄", "aakam"],
  ["converse", "converse"],
  ["컨버스", "converse"],
  ["threetimes", "threetimes"],
  ["쓰리타임즈", "threetimes"],
  ["adidas", "adidas"],
  ["아디다스", "adidas"],
]);

export function brandLogo(brand: string): string | undefined {
  const logo = logos.get(brand.toLowerCase().replace(/[\s-]+/g, ""));
  return logo && `/brand-logos/${logo}.png`;
}
