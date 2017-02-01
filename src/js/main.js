import { select, selectAll } from 'd3-selection'
import { csvParse } from 'd3-dsv'
import { scaleLinear, scaleSqrt } from 'd3-scale'

import { drawCircle, calcBefore } from './drawing'

import data from '../assets/data/countries.csv!text'
import mainHTML from './text/main.html!text'
import throttle from './lib/throttle'

// import iframeMessenger from 'guardian/iframe-messenger'

export function init(el, context, config, mediator) {
  // iframeMessenger.enableAutoResize();
  console.log("v2");
  let parsedData = csvParse(data);
  el.style.position = "initial";
  select(document.body).append("div").classed("tooltip", true);
  render();
  window.addEventListener("resize", throttle(render, 300));

  function render() {
    el.innerHTML = mainHTML;
    let data = parsedData;
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

    var topRad = (containerWidth <= 850) ? 65*(containerWidth/(860)) : 65;

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
      select(el).select(".int-h1").text("Which countries met millennium development goal 2?");
      select(el).select(".int-h2").html('Less than half of all countries achieved universal primary education by 2015, but more than 80% of high income countries met the goal. Countries are <b>sized according to their population</b> and coloured by their status as either <b class="high">high income</b>, <b class="middle">middle income</b> or <b class="low">low income</b></p>');
      drawCircle(svgMet, mdgNotMet, "Did not meet MDG 2", select(el), containerWidth, 0);
      drawCircle(svgMet, mdgMet, "Met MDG 2", select(el), containerWidth, 1);
    } else {
      select(el).select(".int-h1").text("Which countries are forecast to meet sustainable development goal 4?");
      select(el).select(".int-h2").html('Just 12 countries are expected to achieve universal primary and secondary education by 2030, with no low income countries among them. Countries are <b>sized according to their population</b> and coloured by their status as either <b class="high">high income</b>, <b class="middle">middle income</b> or <b class="low">low income</b></p>');
      drawCircle(svgMet, sdgNotMeet, "Won't meet SDG 4", select(el), containerWidth, 0);
      drawCircle(svgMet, sdgMeet, "Will meet SDG 4", select(el), containerWidth, 1);
    }
  }
}
