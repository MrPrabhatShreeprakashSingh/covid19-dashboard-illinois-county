d3.json("data/top_counties_data.json").then(function(data) {
    const margin = { top: 40, right: 30, bottom: 60, left: 150 };
    const width = 1080 - margin.left - margin.right; // widened to make room for legend
    const height = 500 - margin.top - margin.bottom; // reduced from 600

    const svg = d3.select("#scene-bar")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 120) // extra space for legend
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Sort data by case count descending
    data.sort((a, b) => b.cases - a.cases);

    // Y-axis: counties
    const y = d3.scaleBand()
        .range([0, height])
        .domain(data.map(d => d.county))
        .padding(0.15); // slightly reduced for spacing

    svg.append("g")
        .call(d3.axisLeft(y));

    // X-axis: case counts
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.cases)])
        .range([0, width]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(10, "~s"));

    // X-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Total Confirmed COVID-19 Cases");

    // Define urban/suburban counties
    const urbanCounties = new Set(["Cook", "DuPage", "Lake", "Will", "Kane", "McHenry"]);

    // Bars with color coding
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.county))
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", d => x(d.cases))
        .attr("fill", (d, i) => {
            if (i < 3) return "#d62728"; // Top 3 counties
            return urbanCounties.has(d.county) ? "#1f77b4" : "#aec7e8";
        });

    // Add value labels at the end of each bar
    svg.selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.cases) + 5)
        .attr("y", d => y(d.county) + y.bandwidth() / 2 + 4)
        .text(d => d3.format("~s")(d.cases))
        .style("font-size", "12px")
        .style("fill", "#333");

    // Add a legend for color coding (right side of chart)
    const legendData = [
        { label: "Top 3 Counties", color: "#d62728" },
        { label: "Urban/Suburban", color: "#1f77b4" },
        { label: "Rural", color: "#aec7e8" }
    ];

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + (width + 40) + "," + (height / 4) + ")");

    legend.selectAll("rect")
        .data(legendData)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 24)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => d.color);

    legend.selectAll("text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("x", 26)
        .attr("y", (d, i) => i * 24 + 13)
        .text(d => d.label)
        .style("font-size", "11px")
        .style("fill", "#333");
});
