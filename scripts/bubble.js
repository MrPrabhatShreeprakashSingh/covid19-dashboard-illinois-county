d3.csv("data/il-county-bubble-monthly.csv").then(function(data) {
  const margin = { top: 40, right: 160, bottom: 100, left: 80 };
  const width = 800 - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;

  const container = d3.select("#scene-bubble");

  const uniqueDates = Array.from(new Set(data.map(d => d.date))).sort();
  let currentIndex = uniqueDates.length - 1;
  let playing = false;
  let intervalId;

  const sliderWrapper = container.insert("div", ":first-child")
    .style("margin-bottom", "16px")
    .style("position", "relative")
    .style("padding", "10px")
    .style("background", "#f4f8fb")
    .style("border", "1px solid #ccc")
    .style("border-radius", "6px");

  const controlRow = sliderWrapper.append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "10px")
    .style("margin-bottom", "8px");

  controlRow.append("div")
    .attr("id", "slider-date")
    .style("font-size", "14px")
    .style("flex", "1")
    .style("text-align", "center")
    .style("font-weight", "bold")
    .style("color", "#333");

  const playButton = controlRow.append("button")
    .text("▶️ Play")
    .style("padding", "4px 12px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("cursor", "pointer")
    .style("background", "#e6f0fa")
    .style("font-size", "13px");

  const speedControl = controlRow.append("select")
    .style("padding", "4px")
    .style("font-size", "13px")
    .style("cursor", "pointer");

  speedControl.selectAll("option")
    .data([
      { label: "⏩ Fast", value: 500 },
      { label: "▶ Normal", value: 1500 },
      { label: "🐢 Slow", value: 3000 }
    ])
    .enter()
    .append("option")
    .attr("value", d => d.value)
    .text(d => d.label);

  playButton.on("click", function () {
    playing = !playing;
    playButton.text(playing ? "⏸️ Pause" : "▶️ Play");
    if (playing) {
      const speed = +speedControl.node().value;
      intervalId = setInterval(() => {
        currentIndex = (currentIndex + 1) % uniqueDates.length;
        d3.select("#time-slider").property("value", currentIndex);
        update(currentIndex);
      }, speed);
    } else {
      clearInterval(intervalId);
    }
  });

  const slider = sliderWrapper.append("input")
    .attr("type", "range")
    .attr("id", "time-slider")
    .attr("min", 0)
    .attr("max", uniqueDates.length - 1)
    .attr("value", currentIndex)
    .style("width", "100%")
    .style("accent-color", "#3182bd")
    .style("cursor", "pointer")
    .style("transition", "all 0.2s ease-in-out")
    .on("mouseover", function () { d3.select(this).style("box-shadow", "0 0 5px #3182bd"); })
    .on("mouseout", function () { d3.select(this).style("box-shadow", "none"); })
    .on("input", function () {
      currentIndex = +this.value;
      update(currentIndex);
    });

  const narrativeBox = container.append("div")
    .attr("id", "narrative-text")
    .style("font-size", "14px")
    .style("margin-top", "12px")
    .style("line-height", "1.5em")
    .style("background-color", "#fefefe")
    .style("padding", "14px")
    .style("border-left", "5px solid #3182bd")
    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.05)");

  const svg = container
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  data.forEach(d => {
    d.date = d.date;
    d.cases = +d.cases;
    d.deaths = +d.deaths;
  });

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.cases)]).nice()
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.deaths)]).nice()
    .range([height, 0]);

  const radius = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.cases)])
    .range([3, 30]);

  const color = d3.scaleQuantize()
    .domain([0, d3.max(data, d => d.cases)])
    .range(["#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"]);

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x)).selectAll("text").style("font-size", "10px");

  svg.append("g")
    .call(d3.axisLeft(y)).selectAll("text").style("font-size", "10px");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 35)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Total COVID-19 Cases");

  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Total COVID-19 Deaths");

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip-bubble")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("padding", "6px")
    .style("background", "#333")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("font-size", "12px");

  const summaryBox = container.append("div")
    .attr("class", "summary-box")
    .style("margin-top", "24px")
    .style("padding", "14px")
    .style("border-left", "5px solid #3182bd")
    .style("background-color", "#f9f9f9")
    .style("font-size", "13px")
    .style("line-height", "1.2")
    .html(`
      <strong>📊 Chart Description:</strong><br>
      This dynamic bubble chart illustrates the evolving COVID-19 impact across Illinois counties over time. Each bubble represents a county, with its position determined by the total number of confirmed cases (x-axis) and reported deaths (y-axis). Bubble size encodes case volume, and color denotes severity tiers.<br><br>
      <strong>📅 Use the time slider</strong> to observe how the pandemic progressed month by month. Notable events like surge periods and vaccine rollouts are annotated directly on the chart and explained through synchronized narrative text above. The timeline slider at the top lets users scrub through the progression from early 2020 to mid-2022.<br><br>
      <strong>Click ▶️ Play:</strong> to animate the timeline or adjust speed via the dropdown for slower or faster review.<br><br>
      <strong>🔍 Tip:</strong> Hover over any bubble to see county-specific case and death counts.<br><br>
      This visualization supports both macro-level pattern recognition (e.g., urban vs rural trends) and micro-level inspection (e.g., anomalies in Cook or Lake counties), offering a comprehensive view of how COVID-19 evolved geographically across Illinois over time.
    `);

  const bubbleGroup = svg.append("g");
  const annotationGroup = svg.append("g");

  const annotations = {
    "2020-03-01": "⚠️ First COVID-19 cases appear in Illinois.",
    "2020-11-01": "🛑 Surge Begins: Nov 2020",
    "2021-01-01": "💉 Vaccine Rollout Begins",
    "2022-01-01": "📈 Omicron Surge"
  };

  function update(dateIndex) {
    const currentDate = uniqueDates[dateIndex];
    const currentData = data.filter(d => d.date === currentDate);

    d3.select("#slider-date").text(`Date: ${currentDate}`);

    const bubbles = bubbleGroup.selectAll("circle")
      .data(currentData, d => d.county);

    bubbles.enter()
      .append("circle")
      .attr("cx", d => x(d.cases))
      .attr("cy", d => y(d.deaths))
      .attr("r", 0)
      .style("fill", d => color(d.cases))
      .style("opacity", 0.8)
      .merge(bubbles)
      .transition()
      .duration(600)
      .ease(d3.easeCubicInOut)
      .attr("cx", d => x(d.cases))
      .attr("cy", d => y(d.deaths))
      .attr("r", d => radius(d.cases));

    bubbles.exit().remove();

    bubbleGroup.selectAll("circle")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
        tooltip.style("visibility", "visible")
          .html(`<strong>${d.county}</strong><br>Cases: ${d.cases.toLocaleString()}<br>Deaths: ${d.deaths.toLocaleString()}`);
      })
      .on("mousemove", event => {
        tooltip.style("top", (event.pageY - 10) + "px")
               .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke", null).attr("stroke-width", null);
        tooltip.style("visibility", "hidden");
      });

    annotationGroup.selectAll("text").remove();
    if (annotations[currentDate]) {
      annotationGroup.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "15px")
        .style("font-weight", "bold")
        .style("fill", "#d62728")
        .text(annotations[currentDate]);

      d3.select("#narrative-text").html(`<strong>${annotations[currentDate]}</strong><br>This period marks a significant event in the COVID-19 timeline in Illinois.`);
    } else {
      d3.select("#narrative-text").html("Hover over any bubble to view detailed case and death statistics for a county.");
    }
  }

  update(currentIndex);
});
