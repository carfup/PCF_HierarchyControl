/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-var */
/* eslint-disable no-debugger */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { OrgChart } from "d3-org-chart";
import { useEffect, useRef } from "react";
import { renderToString } from "react-dom/server";
import { Label } from "@fluentui/react-components";

const OrgChartComponent = (props: any) => {
  const d3Container = useRef(null);
  const chartRef = useRef(new OrgChart());

  // We need to manipulate DOM
  useEffect(() => {
    if (props.data && d3Container.current) {
      var con = chartRef.current.container(d3Container.current);
      var data = con.data(props.data);
      var nodeWidth = data.nodeWidth((_d) => 360);
      var initialZoom = nodeWidth.initialZoom(0.7);
      var nodeHeight = initialZoom.nodeHeight((_d) => 145);
      var childrenMargin = nodeHeight.childrenMargin((_d) => 50);
      var compactMarginBetween = childrenMargin.compactMarginBetween(
        (_d) => 50
      );
      var compactMarginPair = compactMarginBetween.compactMarginPair(
        (_d) => 80
      );
      var setActiveNodeCentered = compactMarginPair.setActiveNodeCentered(true);
      var nodeContent = setActiveNodeCentered
        .nodeContent(function (d: any, i, arr, state) {
          const backgroundColor =
            d.data.id == props.currentRecordId ? "#FFFFFF" : "#FFFFFF";
          const borderColor =
            d.data.id == props.currentRecordId ? "#FF0000" : "#E4E2E9";
          const textMainColor = "#08011E";
          const textColor = "#716E7B";
          const initials = d.data.name.value
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase();
          const circleBackgroundColor =
            d.data.id == props.currentRecordId ? "#FF0000" : "#E4E2E9";

          const imageDiffVert = 25 + 2;

          return ` 
                <div style='width:${
                  d.width
                }px;height:${d.height}px;padding-top:${imageDiffVert - 2}px;padding-left:1px;padding-right:1px'>
                        <div style="font-family: 'Inter', sans-serif;background-color:${backgroundColor};  margin-left:-1px;width:${d.width - 2}px;height:${d.height - imageDiffVert}px;border-radius:10px;border: 1px solid ${borderColor};">
                            <div style="display:flex;justify-content:flex-end;margin-top:5px;margin-right:8px;color:${textColor}"><a href="${linkToRecord(d.data.id)}">${getIcon("link")}</a></div>
                            <div style="background-color:${backgroundColor};margin-top:${-imageDiffVert - 20}px;margin-left:${15}px;border-radius:100px;width:50px;height:50px;" ></div>
                            <div style="margin-top:${
                              -imageDiffVert - 20
                            }px;">   <span style="display: inline-block;background-color: ${getRandomColor()};color: #fff;border-radius: 50%;font-size: 18px;line-height: 40px;width: 40px;height: 40px;text-align: center;margin-left: 20px;font-family:'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif;font-weight:600;">${initials}</span></div>
                            <div style="font-size:20px;color:${textMainColor};margin-left:20px;margin-top:10px;"> 
                              ${d.data.name.value} 
                            </div>
                            <div style="color:${textColor};margin-left:20px;margin-top:3px;font-size:12px;"> 
                              <div style="display:flex;align-items:center" title="${
                                d.data.attribute1.displayName
                              }">${getIcon(d.data.attribute1.type)}&nbsp; ${d.data.attribute1.value}</div>
                              <div style="display:flex;align-items:center" title="${
                                d.data.attribute2.displayName
                              }">${getIcon(d.data.attribute2.type)}&nbsp; ${d.data.attribute2.value}</div>
                              <div style="display:flex;align-items:center" title="${
                                d.data.attribute3.displayName
                              }">${getIcon(d.data.attribute3.type)}&nbsp; ${d.data.attribute3.value}</div>
                            </div>

                        </div>
                    </div>
                            `;
        })
        .expandAll()
        .render();
    }
  }, [props.data, d3Container.current]);

  return (
    <div>
      <div ref={d3Container} />
    </div>
  );

  // Not working
  function centerTheCurrentRecord() {
    chartRef.current.clearHighlighting();
    const data: any = chartRef.current.data();

    data.forEach((d: any) => {
      if (d.idtoLowerCase().includes(props.currentRecordId)) {
        // If matches, mark node as highlighted
        d._highlighted = true;
        d._expanded = true;
      }
    });
  }

  function linkToRecord(id: string) {
    const currentLocation = window.location.href;
    return currentLocation.replace(props.currentRecordId, id);
  }

  function getIcon(icon: string) {
    let result = "";
    switch (icon) {
      case "link":
        result = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="M12 6.5A3.5 3.5 0 0 0 8.5 3h-4l-.192.005a3.5 3.5 0 0 0-1.305 6.66a4.6 4.6 0 0 1 .093-1.096A2.5 2.5 0 0 1 4.5 4h4l.164.006A2.5 2.5 0 0 1 8.5 9l-1.002.005l-.09.008a.5.5 0 0 0 .094.992l1-.005l.192-.005A3.5 3.5 0 0 0 12 6.5m2 3c0-.86-.435-1.62-1.096-2.07a4.5 4.5 0 0 0 .093-1.095a3.5 3.5 0 0 1-1.303 6.66l-.192.005l-1 .005l-.07-.005H7.5a3.5 3.5 0 0 1-.192-6.995L7.5 6h1a.5.5 0 0 1 .09.992L8.5 7h-1a2.5 2.5 0 0 0-.164 4.995L7.5 12H11v.002l.5-.002A2.5 2.5 0 0 0 14 9.5"></path></svg>`;
        break;
      case "money":
        result = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="M9 7a2 2 0 1 1-4 0a2 2 0 0 1 4 0M8 7a1 1 0 1 0-2 0a1 1 0 0 0 2 0M1 4.25C1 3.56 1.56 3 2.25 3h9.5c.69 0 1.25.56 1.25 1.25v5.5c0 .69-.56 1.25-1.25 1.25h-9.5C1.56 11 1 10.44 1 9.75zM2.25 4a.25.25 0 0 0-.25.25V5h.5a.5.5 0 0 0 .5-.5V4zM2 9.75c0 .138.112.25.25.25H3v-.5a.5.5 0 0 0-.5-.5H2zm2-.25v.5h6v-.5A1.5 1.5 0 0 1 11.5 8h.5V6h-.5A1.5 1.5 0 0 1 10 4.5V4H4v.5A1.5 1.5 0 0 1 2.5 6H2v2h.5A1.5 1.5 0 0 1 4 9.5m7 .5h.75a.25.25 0 0 0 .25-.25V9h-.5a.5.5 0 0 0-.5.5zm1-5v-.75a.25.25 0 0 0-.25-.25H11v.5a.5.5 0 0 0 .5.5zm-7.5 8a1.5 1.5 0 0 1-1.427-1.036Q3.281 12 3.5 12h8.25A2.25 2.25 0 0 0 14 9.75V5.085A1.5 1.5 0 0 1 15 6.5v3.25A3.25 3.25 0 0 1 11.75 13z"></path></svg>`;
        break;
      case "lookup":
        result = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="M9.309 10.016a4.5 4.5 0 1 1 .707-.707l3.838 3.837a.5.5 0 0 1-.708.708zM10 6.5a3.5 3.5 0 1 0-7 0a3.5 3.5 0 0 0 7 0"></path></svg>`;
        break;
      case "datetime":
      case "date":
        result = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="M5.248 8.997a.748.748 0 1 0 0-1.497a.748.748 0 0 0 0 1.497m.749 1.752a.748.748 0 1 1-1.497 0a.748.748 0 0 1 1.497 0M8 8.997A.748.748 0 1 0 8 7.5a.748.748 0 0 0 0 1.497m.749 1.752a.748.748 0 1 1-1.497 0a.748.748 0 0 1 1.497 0m2-1.752a.748.748 0 1 0 0-1.497a.748.748 0 0 0 0 1.497M14 4.5A2.5 2.5 0 0 0 11.5 2h-7A2.5 2.5 0 0 0 2 4.5v7A2.5 2.5 0 0 0 4.5 14h7a2.5 2.5 0 0 0 2.5-2.5zM3 6h10v5.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 11.5zm1.5-3h7A1.5 1.5 0 0 1 13 4.5V5H3v-.5A1.5 1.5 0 0 1 4.5 3"></path></svg>`;
        break;
      case "text":
        result = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="M3 2.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V3H8v10h1a.5.5 0 0 1 0 1H6a.5.5 0 0 1 0-1h1V3H4v1.5a.5.5 0 0 1-1 0z"></path></svg>`;
        break;
      case "number":
        result = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="M6.992 2.592a.5.5 0 1 0-.984-.18L5.538 5H3.495a.5.5 0 0 0 0 1h1.86l-.728 4H2.5a.5.5 0 0 0 0 1h1.946l-.44 2.41a.5.5 0 0 0 .985.18L5.462 11h3.982l-.439 2.409a.5.5 0 0 0 .984.18l.472-2.59H12.5a.5.5 0 0 0 0-1h-1.857l.728-3.998H13.5a.5.5 0 1 0 0-1h-1.946l.439-2.409a.5.5 0 1 0-.984-.179l-.472 2.588H6.554zM6.372 6h3.983l-.729 4H5.644z"></path></svg>`;
        break;
      default:
        result = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2.5 7.5a.5.5 0 1 0 0 1h9.697l-4.031 3.628a.5.5 0 1 0 .668.744l5-4.5a.5.5 0 0 0 0-.744l-5-4.5a.5.5 0 0 0-.668.744L12.197 7.5z"></path></svg>`;
        break;
    }

    return result;
  }

  function getRandomColor() {
    const colors = [
      "#f1bbbc",
      "#9fd89f",
      "#f4bfab",
      "#fef7b2",
      "#edbbe7",
      "#a7e3a5",
      "#f9e2ae",
      "#d69ca5",
      "#eeacb2",
      "#efc4ad",
      "#ffddb3",
      "#ecdfa5",
      "#e0cea2",
      "#ddc3b0",
      "#bdd99b",
      "#a8f0cd",
      "#9ad29a",
      "#a6e9ed",
      "#9bd9db",
      "#94c8d4",
      "#a9d3f2",
      "#9abfdc",
      "#c8d1fa",
      "#a3b2e8",
      "#d2ccf8",
      "#d9a7e0",
      "#eca5d1",
      "#bcc3c7",
      "#eeacb2",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
};

export default OrgChartComponent;
