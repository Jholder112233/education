import { select, selectAll, mouse } from 'd3-selection'
import { transition } from 'd3-transition'
import { easeElasticOut } from 'd3-ease' 
import { packSiblings, packEnclose } from 'd3-hierarchy'
import throttle from './lib/throttle'

var header = document.getElementById("header");

export function incomeColour(incomeGroup) {
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

export function calcBefore(country, data, attr) {
  let beforeNumber = data.filter((row) => {
    return Number(row[attr]) > Number(country[attr]);
  }).length;

  return ((beforeNumber/(data.length-1)) * 100).toFixed(1);
}

export function calcTargetYears(country, attr, target) {
  let years = country[attr] - target;

  return years.toFixed(0);
}


// export function incomeColour(incomeGroup) {
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

export function drawCircle(svg, data, title, el, containerWidth, int) {
  console.log(containerWidth);
  let mobile = containerWidth <= 740;
  let headerHeight = (header) ? header.clientHeight : 0;
  const padding = 1.5;

  let circles = packSiblings(data);
  let bigCircle = packEnclose(circles);
  let totalEl = el.select(".table-wrapper-" + int + " .count");
  console.log(totalEl);
  let tooltip = el.select(".tooltip");

  let incomeElObj = {
    "Low income": el.select(".table-wrapper-" + int).select(".low"),
    "Lower middle income": el.select(".table-wrapper-" + int).select(".lm"),
    "Upper middle income": el.select(".table-wrapper-" + int).select(".um"),
    "High income": el.select(".table-wrapper-" + int).select(".high")
  };

  var group = svg.append("g");

  group.append("g").append("circle")
    .attr("cx", bigCircle.x )
    .attr("cy", bigCircle.y )
    .attr("r", bigCircle.r )
    .style("fill", "#f6f6f6")
    .style("fill-opacity", "0.75");

  if(int === 0) {
    svg.attr("height", ((bigCircle.r*2) + 48));
  }

  let circleG = group.append("g")
    .selectAll("circle")
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

        let headerOffset = window.scrollY + Number(svg.node().parentNode.parentNode.offsetParent.getBoundingClientRect().top);
        let verticalOffset = (Number(year) > 2015) ? event.pageY - 84 - headerOffset: event.pageY - 72 - headerOffset;

        tooltip.style("position", "absolute")
          .style("display", "block")
          .style("left", (event.pageX - 126) + "px")
          .style("top", verticalOffset + "px")
          .html(`<span class="tooltip__country">${d.country}</div><span class="tooltip__when">${achieveMessage} ${d.educationLevel} in <b>${year}</b>, before <b>${d.before}%</b> of the world</span>`);
      })
      .on("mouseout", function(d) {
        tooltip.style("display", "none");
      })
    

  let textG = group.append("g")
    .selectAll("text")
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
      });

  var animated = false;
  var screenHeight = window.innerHeight;

  function doAnimation(isMobile) {
    var duration = 1;

    if(isMobile === true) {
      duration = 0;
    }

    console.log(isMobile, animated, title);

    if(true || (isMobile && !animated) || (!animated && (svg.node().getBoundingClientRect().bottom + 100 < screenHeight || svg.node().getBoundingClientRect().top < 0))) {
      animated = true;
      circleG.transition()
        .ease(easeElasticOut)
        .delay(function(d, i) { return (500 + (i * 25))*duration; })
        .duration(1200*duration)
        .attr("r", (d, i) => {
          setTimeout(() => {
            let newCountTotal = Number(totalEl.html()) + 1;
            if(d.income !== "Not classified") {
              let newIncomeTotal = Number(incomeElObj[d.income].html()) + 1;
              incomeElObj[d.income].html(newIncomeTotal);
            }
            totalEl.html(newCountTotal);
          }, (500+(i * 25))*duration);

          return d.r - padding
        });

      textG.transition()
        .delay(function(d, i) { return ((i * 25) + 500 + 500)*duration; })
        .duration(300*duration)
        .style("opacity", (d) => {
          if(d.r > 12) {
            return 1;
          } else {
            return 0;
          }
        });
    }
  }

  if(!mobile) {
    doAnimation();
    // window.addEventListener("scroll", throttle(doAnimation, 100));
  } else {
    doAnimation(true);
  }

  let offset = (int > 0) ? 1.5 : 0.5;

  group.append("text")
    .text(title)
    .attr("y", (svg.attr("height")/2) - bigCircle.r - 12)
    .attr("x", ((svg.attr("width")/2)*offset))
    .style("text-anchor", "middle");

  //position groups 
  group.selectAll("g")
    .style("transform", "translate(" + ((svg.attr("width")/2)*offset) + "px," + svg.attr("height")/2 + "px)");
}
