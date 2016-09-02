import { select, selectAll } from 'd3-selection'
import { csvParse } from 'd3-dsv'
import { scaleLinear, scaleSqrt } from 'd3-scale'

import { drawCircle, calcBefore } from './drawing'

import data from '../assets/data/countries.csv!text'
import mainHTML from './text/main.html!text'

// import iframeMessenger from 'guardian/iframe-messenger'

export function init(el, context, config, mediator) {
  // iframeMessenger.enableAutoResize();

  let parsedData = csvParse(data);
  el.style.position = "initial";
  select(document.body).append("div").classed("tooltip", true);
  el.innerHTML = mainHTML;
  render(el, parsedData)
}

function render(el, data) {
  let containerWidth = el.clientWidth;
  let padding = 0;
  let fullWidth = containerWidth - padding;
  let halfWidth = (fullWidth > 740) ? fullWidth/2 : fullWidth;
  let middleWidth = el.clientWidth;

  // el.style.overflow = "visible";
  el.style.marginBottom = "24px";

  let svgMet = select(el).select(".svg-wrapper").append("svg")
    .attr("width", containerWidth)
    .attr("height", 420)
    .style("overflow", "visible");

  let topRad = (containerWidth <= 620) ? 60*(containerWidth/(620)) : 75;

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
  if(el.getAttribute("data-alt") === "mdg") {
    select(el).select(".int-h1").text("Which countries met Millenium Development Goal 4.1?");
    select(el).select(".int-h2").text("MDG 4.1: Ensure that, by 2015, children everywhere, boys and girls alike, will be able to complete a full course of primary schooling");
    drawCircle(svgMet, mdgNotMet, "Did not meet the MDG", select(el), containerWidth, 0);
    drawCircle(svgMet, mdgMet, "Met the MDG", select(el), containerWidth, 1);
  } else {
    select(el).select(".int-h1").text("Which countries are forecast to meet Sustainable Development Goal 4.1?");
    select(el).select(".int-h2").text("SDG 4.1: By 2030, ensure that all girls and boys complete free, equitable and quality primary and secondary education leading to relevant and effective learning outcomes");
    drawCircle(svgMet, sdgNotMeet, "Won't meet the SDG", select(el), containerWidth, 0);
    drawCircle(svgMet, sdgMeet, "Will meet the SDG", select(el), containerWidth, 1);
  }

}
