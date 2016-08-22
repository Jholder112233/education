import { select, selectAll } from 'd3-selection'
import { csvParse, csvParseRows } from 'd3-dsv'
import { scaleLinear, scaleSqrt } from 'd3-scale'

import { drawCircle, drawBlockThree, drawInfantMortality, drawPoverty, incomeColour, calcBefore } from './drawing'

import data from '../assets/data/countries.csv!text'
import infantMortalityData from '../assets/data/infant-mortality-two.csv!text'
import povertyData from '../assets/data/poverty.csv!text'
import mainHTML from './text/main.html!text'

import domReady from 'domready'
// import iframeMessenger from 'guardian/iframe-messenger'

export function init(el, context, config, mediator) {
  // iframeMessenger.enableAutoResize();
  
  let parsedData = csvParse(data);
  el.innerHTML = mainHTML;

  domReady(function () {
    render(el, parsedData)
  });
}

function render(el, data) {
  let containerWidth = document.querySelector(".interactive-container").clientWidth;
  let padding = (containerWidth > 740) ? 40 : 20;
  let fullWidth = containerWidth - padding; console.log(fullWidth);
  let halfWidth = (fullWidth > 740) ? fullWidth/2 : fullWidth;
  let middleWidth = document.querySelector(".middle").clientWidth;

  let svgMet = select(".int-block-one .svg-one .svg-wrapper").append("svg")
    .attr("width", halfWidth)
    .attr("height", 420);

  let svgNotMet = select(".int-block-one .svg-two .svg-wrapper").append("svg")
    .attr("width", halfWidth)
    .attr("height", 420);

  let svgSDGMeet = select(".int-block-two .svg-one .svg-wrapper").append("svg")
    .attr("width", halfWidth)
    .attr("height", 500);

  let svgSDGNotMeet = select(".int-block-two .svg-two .svg-wrapper").append("svg")
    .attr("width", halfWidth)
    .attr("height", 500);

  let svgThreeScale = select(".int-block-three .svg-one").append("svg")
    .attr("width", 40)
    .attr("height", 300)
    .style("overflow", "visible")
    // .style("margin-top", "24px")
    .style("position", "absolute")
    .style("z-index", "3")
    .style("left", 0)
    .style("top", 0)
    .style("background-color", "#fff");

  let svgThree = select(".int-block-three .svg-one .svg-wrapper").append("svg")
    .attr("width", fullWidth)
    .attr("height", 300)
    .style("overflow", "visible")
    // .style("margin-bottom", "24px")
    // .style("margin-top", "24px");

  let svgFourScale = select(".int-block-three .svg-two").append("svg")
    .attr("width", 40)
    .attr("height", 300)
    .style("overflow", "visible")
    // .style("margin-top", "24px")
    .style("position", "absolute")
    .style("z-index", "3")
    .style("left", 0)
    .style("top", 0)
    .style("background-color", "#fff");

  let svgFour = select(".int-block-three .svg-two .svg-wrapper").append("svg")
    .attr("width", fullWidth)
    .attr("height", 300)
    .style("overflow", "visible")
    // .style("margin-bottom", "24px")
    // .style("margin-top", "24px");

  let svgFive = select(".int-block-four .svg-one .svg-wrapper").append("svg")
    .attr("width", middleWidth)
    .attr("height", 340)
    .style("overflow", "visible")
    .style("margin", "auto")
    .style("margin-bottom", "24px");

  let svgSix = select(".int-block-five .svg-one .svg-wrapper").append("svg")
    .attr("width", middleWidth)
    .attr("height", 400)
    .style("overflow", "visible")
    .style("margin", "auto")
    .style("margin-bottom", "24px");

  let topRad = (fullWidth < 227.65*2) ? 65*(fullWidth/(227.65*2)) : 80;

  let radiusScale = scaleSqrt()
    .domain([100000,1371220000])
    .range([5, topRad]);

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
  drawCircle(svgMet, mdgMet, "Met the MDG", select(".int-block-one .svg-one"), containerWidth);
  drawCircle(svgNotMet, mdgNotMet, "Did not meet the MDG", select(".int-block-one .svg-two"), containerWidth);

  // block 2
  drawCircle(svgSDGMeet, sdgMeet, "Forecast to meet the SDG", select(".int-block-two .svg-one"), containerWidth);
  drawCircle(svgSDGNotMeet, sdgNotMeet, "Forecast not to meet the SDG", select(".int-block-two .svg-two"), containerWidth);

  // block 3
  drawBlockThree(svgThree, data, "primary", "Target year for universal primary education", 2015, svgThreeScale);
  drawBlockThree(svgFour, data, "upperSecondary", "Target year for universal secondary education", 2030, svgFourScale);

  // block 4
  drawInfantMortality(svgFive, csvParse(infantMortalityData));

  // block 5
  drawPoverty(svgSix, csvParseRows(povertyData));

  document.addEventListener("click", function(e) {
    if(e.target.classList.contains("country-button")) {
      let el = select(e.target);
      let code = el.attr("data-code");
      let blockName = el.attr("data-block");
      let svgName = el.attr("data-svg");

      let toHighlight = selectAll("." + blockName + " ." + svgName + " line[data-code=" + code + "]");

      toHighlight.style("stroke", "#333");
    }
  });

}