import { select, selectAll, mouse } from 'd3-selection'
import { csvParse } from 'd3-dsv'
import { scaleLinear, scaleSqrt } from 'd3-scale'
import { axisLeft } from 'd3-axis'
import { format } from 'd3-format'
import { transition } from 'd3-transition'
import { easeCubic, easeElasticOut, easeExpIn, easeBackOut, easeBounceOut, easePolyIn } from 'd3-ease' 
import { packSiblings, packEnclose } from 'd3-hierarchy'
import data from '../assets/data/countries.csv!text'
import mainHTML from './text/main.html!text'
import tableHTML from './text/table.html!text'

const padding = 2;

export function init(el, context, config, mediator) {
  let parsedData = csvParse(data);
  el.innerHTML = mainHTML;
  render(el, parsedData)
}

function incomeColour(incomeGroup) {
  var colour;
  switch(incomeGroup) {
    case "High income":
        colour = "#005689";
        break;
    case "Upper middle income":
        colour = "#4bc6df";
        break;
    case "Lower middle income":
        colour = "#ffbb00";
        break;
    case "Low income":
        colour = "#c05303";
        break;
    default:
        colour = "#767676";
  }
  return colour;
}

// function incomeColour(incomeGroup) {
//   var colour;
//   switch(incomeGroup) {
//     case "High income":
//         colour = "rgb(57, 164, 216)";
//         break;
//     case "Upper middle income":
//         colour = "rgb(138, 199, 205)";
//         break;
//     case "Lower middle income":
//         colour = "rgb(253, 208, 158)";
//         break;
//     case "Low income":
//         colour = "rgb(237, 61, 97)";
//         break;
//     default:
//         colour = "#767676";
//   }
//   return colour;
// }

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
}

function drawCircle(svg, data, title, el) {
  let circles = packSiblings(data);
  let bigCircle = packEnclose(circles);
  let totalEl = el.select(".count");

  let tooltip = select(".tooltip");

  let incomeElObj = {
    "Low income": el.select(".low"),
    "Lower middle income": el.select(".lm"),
    "Upper middle income": el.select(".um"),
    "High income": el.select(".high")
  };

  svg.append("g").append("circle")
    .attr("cx", bigCircle.x )
    .attr("cy", bigCircle.y )
    .attr("r", bigCircle.r )
    .style("fill", "#f6f6f6");
    // .style("fill-opacity", "0.3"); 

  svg.append("g").selectAll("circle")
    .data(circles)
    .enter().append("circle")
      .attr("class", (d,i) => { return "country " + d.code3; })
      .classed("small-circle", true)
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style("fill", (d) => {
        return incomeColour(d.income);
      })
      .style("stroke", (d) => {
        return incomeColour(d.income);
      })
      .style("fill-opacity", "0.2")
      .style("stroke-width", "1px")
      .attr("r", 0)
      .on("mousemove", function(d) {
        let year = (d.educationLevel === "universal secondary education") ? d.upperSecondary : d.primary;
        let achieveMessage = (Number(year) > 2015) ? "Forecast to achieve" : "Achieved";
        let verticalOffset = (Number(year) > 2015) ? event.pageY - 84 : event.pageY - 72;

        tooltip.style("position", "absolute")
          .style("display", "block")
          .style("left", (event.pageX - 116) + "px")
          .style("top", verticalOffset + "px")
          .html(`<span class="tooltip__country">${d.country}</div><span class="tooltip__when">${achieveMessage} ${d.educationLevel} in <b>${year}</b>, before <b>${d.before}%</b> of the world</span>`);
      })
      .on("mouseout", function(d) {
        tooltip.style("display", "none");
      })
      .transition()
        .ease(easeElasticOut)
        .delay(function(d, i) { return i * 25; })
        .duration(1200)
        .attr("r", (d, i) => {
          setTimeout(() => {
            let newCountTotal = Number(totalEl.html()) + 1;
            if(d.income !== "Not classified") {
              let newIncomeTotal = Number(incomeElObj[d.income].html()) + 1;
              incomeElObj[d.income].html(newIncomeTotal);
            }
            totalEl.html(newCountTotal);
          }, (i * 25));

          return d.r - padding
        });

  svg.append("g").selectAll("text")
    .data(circles)
    .enter().append("text")
      .classed("circle-label", true)
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("dy", "4")
      .style("text-anchor", "middle")
      .style("fill", (d) => {
        return incomeColour(d.income);
      })
      .style("opacity", 0)
      .text((d) => {
        return d.code3;
      })
      .transition()
        .delay(function(d, i) { return (i * 25) + 500; })
        .duration(300)
        .style("opacity", (d) => {
          if(d.r > 12) {
            return 1;
          } else {
            return 0;
          }
        });

  svg.append("text")
    .text(title)
    .attr("y", (svg.attr("height")/2) - bigCircle.r - 12)
    .attr("x", svg.attr("width")/2)
    .style("text-anchor", "middle");

  //position groups
  svg.selectAll("g")
    .style("transform", "translate(" + svg.attr("width")/2 + "px," + svg.attr("height")/2 + "px)");
}