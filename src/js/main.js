import { select, selectAll } from 'd3-selection'
import { csvParse } from 'd3-dsv'
import { scaleLinear, scaleSqrt } from 'd3-scale'

import { drawCircle, drawBlockThree, drawBlockThreeSvg2, incomeColour } from './drawing'

import data from '../assets/data/countries.csv!text'
import mainHTML from './text/main.html!text'
import tableHTML from './text/table.html!text'

export function init(el, context, config, mediator) {
  let parsedData = csvParse(data);
  el.innerHTML = mainHTML;
  render(el, parsedData)
}

function calcBefore(country, data, attr) {
  let beforeNumber = data.filter((row) => {
    return Number(row[attr]) > Number(country[attr]);
  }).length;

  return ((beforeNumber/(data.length-1)) * 100).toFixed(1);
}

function render(el, data) {
  let svgMet = select(".block-one .svg-one .svg-wrapper").append("svg")
    .attr("width", 1260/2)
    .attr("height", 500);

  let svgNotMet = select(".block-one .svg-two .svg-wrapper").append("svg")
    .attr("width", 1260/2)
    .attr("height", 500);

  let svgSDGMeet = select(".block-two .svg-one .svg-wrapper").append("svg")
    .attr("width", 1260/2)
    .attr("height", 600);

  let svgSDGNotMeet = select(".block-two .svg-two .svg-wrapper").append("svg")
    .attr("width", 1260/2)
    .attr("height", 600);

  let svgThree = select(".block-three .svg-one .svg-wrapper").append("svg")
    .attr("width", 1260)
    .attr("height", 300)
    .style("overflow", "visible")
    .style("margin-bottom", "24px");

  let svgFour = select(".block-three .svg-two .svg-wrapper").append("svg")
    .attr("width", 1260)
    .attr("height", 300)
    .style("overflow", "visible")
    .style("margin-bottom", "24px");

  let radiusScale = scaleSqrt()
    .domain([100000,1371220000])
    .range([5, 95]);

  let mdgMet = data.filter((country) => {
      return Number(country.primary) <= 2015;
    }).map((country) => {
      let r = radiusScale(country.population);
      let before = calcBefore(country, data, "primary");
      let educationLevel = "universal primary education";
      return {...country, r, before, educationLevel};
    });

  let mdgNotMet = data.filter((country) => {
      return Number(country.primary) > 2015;
    }).map((country) => {
      let r = radiusScale(country.population);
      let before = calcBefore(country, data, "primary");
      let educationLevel = "universal primary education";
      return {...country, r, before, educationLevel};
    });

  let sdgMeet = data.filter((country) => {
      return Number(country.upperSecondary) <= 2030;
    }).map((country) => {
      let r = radiusScale(country.population);
      let before = calcBefore(country, data, "upperSecondary");
      let educationLevel = "universal secondary education";
      return {...country, r, before, educationLevel};
    });

  let sdgNotMeet = data.filter((country) => {
      return Number(country.upperSecondary) > 2030;
    }).map((country) => {
      let r = radiusScale(country.population);
      let before = calcBefore(country, data, "upperSecondary");
      let educationLevel = "universal secondary education";
      return {...country, r, before, educationLevel};
    }); 

  // block 1
  drawCircle(svgMet, mdgMet, "Met the MDG", select(".block-one .svg-one"));
  drawCircle(svgNotMet, mdgNotMet, "Did not meet the MDG", select(".block-one .svg-two"));

  // block 2
  drawCircle(svgSDGMeet, sdgMeet, "Forecast to meet the SDG", select(".block-two .svg-one"));
  drawCircle(svgSDGNotMeet, sdgNotMeet, "Forecast not to meet the SDG", select(".block-two .svg-two"));

  // block 3
  drawBlockThree(svgThree, data);
  drawBlockThreeSvg2(svgFour, data);
}