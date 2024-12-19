import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import axios from "axios";

/**
 * Interface representing the structure of a safety case node.
 */
interface SafetyCaseData {
  /** Entity details of the node */
  entity: {
    /** Unique identifier for the node */
    id: string;
    /** Description of the node */
    description: string;
    /** Indicates if the node is to be developed */
    toBeDeveloped?: boolean;
  };
  /** Indicates whether the node has failed */
  failed: boolean;
  /** Child nodes */
  children?: SafetyCaseData[];
}

/**
 * Props for the SafetyCaseTree component.
 */
interface SafetyCaseTreeProps {
  /** Safety case data to be visualized */
  data: SafetyCaseData;
  /** Type of tree to render ("full_tree" or "pruned_tree") */
  treeType: "full_tree" | "pruned_tree";
}

/**
 * SafetyCaseTree React component.
 *
 * This component visualizes a safety case tree using D3.js. Nodes are displayed with different
 * shapes and colors based on their type and status.
 *
 * @param {SafetyCaseTreeProps} props - Props containing the data and tree type.
 * @returns {React.FC} A functional component rendering the safety case tree.
 */
const SafetyCaseTree: React.FC<SafetyCaseTreeProps> = ({ data, treeType }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions
    const margin = { top: 40, right: 150, bottom: 40, left: 150 };
    const width = 1200 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3
        .select(svgRef.current)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define tree layout
    const treeLayout = d3.tree<SafetyCaseData>()
        .size([width, height])
        .separation((a, b) => (a.parent === b.parent ? 2 : 2.5));

    // Convert data to hierarchy and layout
    const root = d3.hierarchy(data);
    const treeData = treeLayout(root);

    // Create links (edges) between nodes
    const linkGenerator = d3
        .linkVertical<any, d3.HierarchyPointNode<SafetyCaseData>>()
        .x((d) => d.x)
        .y((d) => d.y);

    svg
        .selectAll(".link")
        .data(treeData.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", linkGenerator)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1.5)
        .style("opacity", 0)
        .transition()
        .duration(750)
        .style("opacity", 1);

    // Create node groups
    const nodeGroups = svg
        .selectAll(".node")
        .data(treeData.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

    // Get node color based on status
    const getNodeColor = (d: d3.HierarchyPointNode<SafetyCaseData>) => {
      if (d.data.failed) return "#ff4444";
      if (d.data.entity.toBeDeveloped) return "#ffbb33";
      return "#00C851";
    };

    // Render node shapes
    nodeGroups.each(function (d) {
      const nodeGroup = d3.select(this);
      const nodeType = d.data.entity.id.charAt(0);
      const color = getNodeColor(d);

      switch (nodeType) {
        case "S": // Solution node
          const triangleSize = 20;
          nodeGroup
              .append("path")
              .attr(
                  "d",
                  `M0,${triangleSize} L${triangleSize},-${triangleSize} L-${triangleSize},-${triangleSize} Z`
              )
              .attr("fill", color)
              .attr("stroke", "#333")
              .attr("stroke-width", 1.5);
          break;

        case "C": // Context node
          const rectSize = 25;
          nodeGroup
              .append("rect")
              .attr("x", -rectSize / 2)
              .attr("y", -rectSize / 2)
              .attr("width", rectSize)
              .attr("height", rectSize)
              .attr("fill", color)
              .attr("stroke", "#333")
              .attr("stroke-width", 1.5);
          break;

        default: // Default to circle
          nodeGroup
              .append("circle")
              .attr("r", 15)
              .attr("fill", color)
              .attr("stroke", "#333")
              .attr("stroke-width", 1.5);
      }
    });

    // Add node labels
    nodeGroups
        .append("text")
        .attr("dy", -22)
        .attr("text-anchor", "middle")
        .text((d) => d.data.entity.id)
        .style("font-size", "12px")
        .style("font-weight", "bold");

    // Add tooltips
    nodeGroups.append("title").text((d) => d.data.entity.description);

    // Add legend
    const legendGroup = svg.append("g").attr("transform", `translate(${width - 5}, 10)`);
    const legendItems = [
      { color: "#00C851", label: "Passed", shape: "circle" },
      { color: "#ff4444", label: "Failed", shape: "circle" },
      { color: "#ffbb33", label: "To Be Developed", shape: "circle" },
    ];

    legendItems.forEach((item, index) => {
      const yOffset = index * 30;
      legendGroup
          .append("circle")
          .attr("cx", 10)
          .attr("cy", yOffset)
          .attr("r", 10)
          .attr("fill", item.color);
      legendGroup
          .append("text")
          .attr("x", 30)
          .attr("y", yOffset)
          .attr("dy", 5)
          .text(item.label)
          .style("font-size", "12px");
    });

    // Upload the rendered SVG
    const sendSvg = async () => {
      if (!svgRef.current) {
        console.error("SVG reference is null.");
        return;
      }
      const svgString = new XMLSerializer().serializeToString(svgRef.current);

      try {
        const response = await axios.post("http://localhost:8080/upload-svg", {
          type: treeType,
          svg: svgString,
        });
        console.log("SVG uploaded successfully:", response.data);
      } catch (error) {
        console.error("Error uploading SVG:", error);
      }
    };

    setTimeout(sendSvg, 1000);
  }, [data]);

  return (
      <div
          className="safety-case-tree-container"
          style={{
            margin: "0 auto",
            padding: "20px",
            border: "1px solid #ccc",
            backgroundColor: "#f9f9f9",
          }}
      >
        <svg ref={svgRef} />
      </div>
  );
};

export default SafetyCaseTree;
