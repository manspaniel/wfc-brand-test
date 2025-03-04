import { Label } from "@/components/ui/label";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { ScrollArea } from "./components/ui/scroll-area";
import { Slider } from "./components/ui/slider";
import { DEFAULT_SVG, LayoutGenerator, parseRules } from "./layout-generator";
import { cn } from "./lib/utils";
import { ColorName, OCTON_COLORS } from "./octon-generator";
import { Textarea } from "./components/ui/textarea";

type Params = {
  svgCode: string;
  rows: number;
  cols: number;
  width: number;
  units: "px" | "mm";
  padding: number;
  density: number;
  airgap: number;
  speed: number;
  bg: ColorName;
  fg: ColorName[];
  includeBg: boolean;
  premultiply: boolean;
};

function normalizeParams(params: Params) {
  // if (params.bg === "Glass" && params.fg.length === 0) {
  //   params.fg = [...OCTON_COLORS];
  // } else if (params.bg !== "Glass") {
  //   params.fg = [params.bg];
  // }
  return params;
}

function App() {
  const [counter, setCounter] = useState(0);
  const [showRects, setShowRects] = useState(false);

  const [params, setParams] = useState<Params>({
    svgCode: DEFAULT_SVG,
    cols: 20,
    rows: 20,
    bg: "Glass",
    fg: [...OCTON_COLORS],
    density: 0.5,
    includeBg: true,
    padding: 0,
    speed: 100,
    airgap: 0.2,
    units: "px",
    width: 1024,
    premultiply: false,
  });

  function updateParams(params: Partial<Params>) {
    setParams((p) =>
      normalizeParams({
        ...p,
        ...params,
      })
    );
  }

  const [redraw, setRedraw] = useState(0);
  const generator = useMemo(() => {
    const generator = new LayoutGenerator();
    generator.cols = params.cols;
    generator.rows = params.rows;
    generator.airgap = params.airgap;
    generator.init();
    return generator;
  }, [params, counter]);

  const rules = useMemo(() => parseRules(params.svgCode), [params.svgCode]);
  useEffect(() => {
    generator.init();
    generator.setRules([
      { shapes: [], edges: [[], [], [], []], coord: [-1, -1], points: [] },
      ...rules,
    ]);
    const gen = generator.generate();

    generator.grid.cells.forEach((cell) => {
      // if (cell.coord.x % 8 === 0 && cell.coord.y % 8 === 0) {
      //   cell.value = generator.grid.rules.at(0)!;
      //   cell.candidates = [cell.value];
      // }
      // if (
      //   cell.coord.y > 4 &&
      //   cell.coord.x > 4 &&
      //   cell.coord.x < 19 &&
      //   cell.coord.y < 15
      // ) {
      //   cell.value = generator.grid.rules.at(0)!;
      //   cell.candidates = [cell.value];
      // }
    });

    console.log("Result", generator.grid);

    let start = 0;
    const timer = setInterval(() => {
      start = start === 0 ? performance.now() : start;
      for (let i = 0; i < params.speed; i++) {
        let done = gen();
        if (done) {
          console.log("DOne", performance.now() - start);
          setRedraw((r) => r + 1);
          return clearInterval(timer);
        }
      }
      setRedraw((r) => r + 1);
    }, 1);
    return () => {
      clearInterval(timer);
    };
  }, [generator, rules]);

  return (
    <div className="fixed flex items-stretch justify-center inset-0">
      <div className="flex flex-col items-center justify-center flex-1">
        <div>
          <div className="p-2">
            <svg
              width={64 * generator.cols}
              height={64 * generator.rows}
              viewBox={`0 0 ${64 * generator.cols} ${64 * generator.rows}`}
              fill="none"
              className="border border-gray-300 border-dashed max-w-[600px] h-auto"
            >
              {generator.grid.cells.map((cell, i) => {
                if (cell.value) {
                  const rule = cell.value!;
                  const transforms = [
                    `translate(${-rule.offset[0] * 64}px, ${
                      -rule.offset[1] * 64
                    }px)`,
                    `translate(-32px, -32px)`,
                    `rotate(${rule.rotation * 90}deg)`,
                    `translate(32px, 32px)`,
                    `translate(${cell.coord.x * 64}px, ${cell.coord.y * 64}px)`,
                  ];
                  return (
                    <g
                      key={i}
                      style={{
                        transform: transforms.reverse().join(" "),
                      }}
                      dangerouslySetInnerHTML={{ __html: rule.svg.join("\n") }}
                    ></g>
                  );
                } else {
                  return (
                    <g key={i}>
                      <rect
                        x={cell.coord.x * 64}
                        y={cell.coord.y * 64}
                        width={64}
                        height={64}
                        fill="rgba(255,0,0,0.2)"
                        stroke="red"
                        opacity={cell.candidates.length / (rules.length * 4)}
                      />
                      {/* {cell.candidates.length < 40 &&
                        cell.candidates.map((rule, j) => {
                          const transforms = [
                            `translate(${-rule.offset[0] * 64}px, ${
                              -rule.offset[1] * 64
                            }px)`,
                            `translate(-32px, -32px)`,
                            `rotate(${rule.rotation * 90}deg)`,
                            `translate(32px, 32px)`,
                            `translate(${cell.coord.x * 64}px, ${
                              cell.coord.y * 64
                            }px)`,
                          ];
                          return (
                            <g
                              key={i}
                              style={{
                                transform: transforms.reverse().join(" "),
                                opacity: 1 - cell.candidates.length / 40,
                              }}
                              dangerouslySetInnerHTML={{
                                __html: rule.svg.join("\n"),
                              }}
                            ></g>
                          );
                        })} */}
                    </g>
                  );
                }
                return null;
              })}
            </svg>
          </div>
        </div>
      </div>
      <ScrollArea className="border-l p-1 items-stretch w-[300px]">
        <div className="flex flex-wrap">
          {rules.map((rule, i) => {
            return (
              <div key={i} className="p-1">
                {/* {rule.edges.map((edge, j) => (
                    <div key={j}>
                      {j}: {edge.join(",")}
                    </div>
                  ))} */}
                <svg
                  fill="none"
                  width={64}
                  height={64}
                  className="border border-gray-300 border-dashed"
                  viewBox={`0 0 64 64`}
                >
                  <g
                    style={{
                      transform: `translate(${-rule.coord[0] * 64}px, ${
                        -rule.coord[1] * 64
                      }px)`,
                      opacity: 0.1,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: rule.shapes.join("\n"),
                    }}
                  ></g>
                  <text
                    x={32}
                    y={8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="red"
                    fontSize="8"
                  >
                    {rule.edges[0].join(",")}
                  </text>
                  <text
                    x={50}
                    y={32}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="red"
                    fontSize="8"
                  >
                    {rule.edges[1].join(",")}
                  </text>
                  <text
                    x={32}
                    y={55}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="red"
                    fontSize="8"
                  >
                    {rule.edges[2].join(",")}
                  </text>
                  <text
                    x={15}
                    y={32}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="red"
                    fontSize="8"
                  >
                    {rule.edges[3].join(",")}
                  </text>
                </svg>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <ScrollArea className="border-l items-stretch w-[300px]">
        <div className="flex flex-col py-2 gap-2">
          <Panel label="SVG">
            <Label>SVG Code</Label>
            <Textarea
              value={params.svgCode.trim()}
              onChange={(e) => {
                setParams((p) => ({
                  ...p,
                  svgCode: e.currentTarget.value,
                }));
              }}
            ></Textarea>
          </Panel>
          <Panel label="Layout">
            <Property label="Cols">
              <Input
                type="number"
                value={params.cols}
                min={1}
                max={1000}
                step={1}
                onChange={(e) =>
                  updateParams({ cols: e.currentTarget.valueAsNumber || 1 })
                }
              />
            </Property>
            <Property label="Rows">
              <Input
                type="number"
                value={params.rows}
                min={1}
                max={1000}
                step={1}
                onChange={(e) =>
                  updateParams({ rows: e.currentTarget.valueAsNumber || 1 })
                }
              />
            </Property>
            <Property label="Airgap">
              <div className="flex gap-2">
                <Slider
                  step={0.01}
                  min={0}
                  max={1}
                  value={[params.airgap]}
                  onValueChange={(val) =>
                    updateParams({
                      airgap: val[0],
                    })
                  }
                />
                <div className="w-10">{params.airgap}</div>
              </div>
            </Property>
            <Property label="Generation Speed">
              <div className="flex gap-2">
                <Slider
                  step={1}
                  min={1}
                  max={500}
                  value={[params.speed]}
                  onValueChange={(val) =>
                    updateParams({
                      speed: val[0],
                    })
                  }
                />
                <div className="w-10">{params.speed}</div>
              </div>
            </Property>
            {/* <Property>
              <Label className="gap-2 flex items-center">
                <Checkbox
                  checked={params.premultiply}
                  onCheckedChange={(checked) =>
                    updateParams({ premultiply: !!checked })
                  }
                />
                <span>Premultiply</span>
              </Label>
            </Property> */}
            {/* {params.premultiply && (
              <Property>
                <Label className="gap-2 flex items-center">
                  <Checkbox
                    checked={params.includeBg}
                    onCheckedChange={(checked) =>
                      updateParams({ includeBg: !!checked })
                    }
                  />
                  <span>Include Background</span>
                </Label>
              </Property>
            )} */}
          </Panel>
          {/* <Panel label="Randomiser">
            <Property label="Density">
              <div className="flex gap-2">
                <Slider
                  step={0.01}
                  min={0}
                  max={1}
                  value={[params.density]}
                  onValueChange={(val) =>
                    updateParams({
                      density: val[0],
                    })
                  }
                />
                <div className="w-10">{params.density}</div>
              </div>
            </Property>
          </Panel> */}
          {/* <Panel label="Debug">
            <Property>
              <Label className="gap-2 flex items-center">
                <Checkbox
                  checked={showRects}
                  onCheckedChange={(checked) => setShowRects(!!checked)}
                />
                <span>Borders</span>
              </Label>
            </Property>
          </Panel> */}
          <div className="flex gap-2 items-stretch justify-stretch w-full px-2">
            <Button className="flex-1" onClick={() => setCounter(counter + 1)}>
              Randomise
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                const svg = document.querySelector("svg") as SVGSVGElement;
                const svgData = new XMLSerializer().serializeToString(svg);
                const canvas = document.createElement("canvas");
                canvas.width = params.cols * 64;
                canvas.height = params.cols * 64;
                const ctx = canvas.getContext("2d");
                const img = new Image();
                img.onload = () => {
                  ctx?.drawImage(img, 0, 0);
                  const a = document.createElement("a");
                  a.href = canvas.toDataURL("image/png");
                  a.download = "output.png";
                  a.click();
                };
                img.src = "data:image/svg+xml;base64," + btoa(svgData);
              }}
            >
              PNG
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                const svg = document.querySelector("svg") as SVGSVGElement;
                const svgData = new XMLSerializer().serializeToString(svg);
                const a = document.createElement("a");
                a.href = "data:image/svg+xml;base64," + btoa(svgData);
                a.download = "output.svg";
                a.click();
              }}
            >
              SVG
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default App;

function Panel(props: PropsWithChildren<{ label: string }>) {
  return (
    <div className="mx-2 border rounded-sm">
      <h2 className="text-sm font-bold px-3 py-1 border-b">{props.label}</h2>
      <div className="flex flex-col px-3 gap-2 py-2">{props.children}</div>
    </div>
  );
}

function Property(
  props: PropsWithChildren<{ label?: string; stack?: boolean; top?: boolean }>
) {
  return (
    <div
      className={cn(
        "flex gap-2 items-center",
        props.stack ? "gap-1 flex-col items-stretch" : "",
        props.top ? "items-start" : ""
      )}
    >
      {!!props.label && (
        <div className="flex-0 w-[40%]">
          <Label>{props.label}</Label>
        </div>
      )}
      <div className="flex-1">{props.children}</div>
    </div>
  );
}
