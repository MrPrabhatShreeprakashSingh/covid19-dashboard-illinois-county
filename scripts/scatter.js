d3.csv("data/il-county-log-summary.csv").then(function(data) {
  const margin = { top: 60, right: 160, bottom: 50, left: 80 };
  const width = 800 - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;

  const container = d3.select("#scatter-container");

  const svg = container
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const useLog = { value: true }; // mutable state

  data.forEach(d => {
    d.cases = +d.cases;
    d.deaths = +d.deaths;
    d.log_cases = +d.log_cases;
    d.log_deaths = +d.log_deaths;
  });

  // Dropdown filter
  const allCounties = Array.from(new Set(data.map(d => d.county))).sort();
  const dropdown = container.insert("select", ":first-child")
    .attr("id", "county-filter")
    .style("margin-bottom", "10px")
    .style("padding", "4px");

  dropdown.append("option").attr("value", "All").text("All Counties");
  dropdown.selectAll("option.county")
    .data(allCounties)
    .enter()
    .append("option")
    .attr("class", "county")
    .attr("value", d => d)
    .text(d => d);

  // Color scale
  const color = d3.scaleQuantize()
    .domain([0, d3.max(data, d => d.cases)])
    .range(["#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"]);

  const radius = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.cases)])
    .range([3, 30]);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip-bubble")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("padding", "6px")
    .style("background", "#333")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("font-size", "12px");

  const xAxisGroup = svg.append("g")
    .attr("transform", `translate(0, ${height})`);

  const yAxisGroup = svg.append("g");

  const xLabel = svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 35)
    .attr("text-anchor", "middle")
    .style("font-size", "12px");

  const yLabel = svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .style("font-size", "12px");

  const bubbles = svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("r", d => radius(d.cases))
    .style("fill", d => color(d.cases))
    .style("opacity", 0.8)
    .style("stroke", "transparent")
    .style("stroke-width", "2px");

  bubbles
    .on("mouseover", function(event, d) {
      tooltip.style("visibility", "visible")
        .html(`<strong>${d.county}</strong><br>Cases: ${d.cases.toLocaleString()}<br>Deaths: ${d.deaths.toLocaleString()}`);
      d3.select(this).style("stroke", "#000");
    })
    .on("mousemove", event => {
      tooltip
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("visibility", "hidden");
      d3.select(this).style("stroke", "transparent");
    });

  function updateScale() {
    const selectedCounty = dropdown.property("value");
    const filtered = selectedCounty === "All" ? data : data.filter(d => d.county === selectedCounty);

    const x = d3.scaleLinear()
      .domain(d3.extent(filtered, d => useLog.value ? d.log_cases : d.cases)).nice()
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain(d3.extent(filtered, d => useLog.value ? d.log_deaths : d.deaths)).nice()
      .range([height, 0]);

    xAxisGroup.transition().duration(1000).call(d3.axisBottom(x).ticks(6));
    yAxisGroup.transition().duration(1000).call(d3.axisLeft(y).ticks(6));

    xLabel.text(useLog.value ? "Log10(COVID-19 Cases)" : "Total COVID-19 Cases");
    yLabel.text(useLog.value ? "Log10(COVID-19 Deaths)" : "Total COVID-19 Deaths");

    svg.selectAll("circle")
      .data(filtered, d => d.county)
      .join(
        enter => enter.append("circle")
          .attr("r", d => radius(d.cases))
          .attr("cx", d => x(useLog.value ? d.log_cases : d.cases))
          .attr("cy", d => y(useLog.value ? d.log_deaths : d.deaths))
          .style("fill", d => color(d.cases))
          .style("opacity", 0.8)
          .style("stroke", "transparent")
          .style("stroke-width", "2px")
          .on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
              .html(`<strong>${d.county}</strong><br>Cases: ${d.cases.toLocaleString()}<br>Deaths: ${d.deaths.toLocaleString()}`);
            d3.select(this).style("stroke", "#000");
          })
          .on("mousemove", event => {
            tooltip
              .style("top", (event.pageY - 10) + "px")
              .style("left", (event.pageX + 10) + "px");
          })
          .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
            d3.select(this).style("stroke", "transparent");
          }),
        update => update.transition().duration(1000)
          .attr("cx", d => x(useLog.value ? d.log_cases : d.cases))
          .attr("cy", d => y(useLog.value ? d.log_deaths : d.deaths))
          .attr("r", d => radius(d.cases)),
        exit => exit.remove()
      );
  }

  updateScale();

  d3.select("#toggle-scale-btn").on("click", function() {
    useLog.value = !useLog.value;
    this.textContent = useLog.value ? "Switch to Linear Scale" : "Switch to Log Scale";
    updateScale();
  });

  dropdown.on("change", updateScale);
});
