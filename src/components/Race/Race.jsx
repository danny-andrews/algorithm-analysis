import { signal } from "@preact/signals";
import { useState, useEffect } from "preact/hooks";
import cn from "classnames";
import c from "./Race.module.css";
import WorkbenchForm from "../WorkbenchForm/WorkbenchForm.jsx";
import Chart from "../Chart/Chart.jsx";
import { noop } from "../../shared.js";
import { addDataToChart, clearChart } from "../Chart/chartUtil.js";
import { iterations } from "../../signals.js";

let chart = signal(null);

const Race = ({ workbenches, runner }) => {
  // TODO: Could I use an enum here?
  const [isRunning, setIsRunning] = useState(false);
  const [selectedWorkbench, setSelectedWorkbench] = useState(null);
  const [shouldShowGraph, setShouldShowGraph] = useState(false);
  const [subscription, setSubscription] = useState({ unsubscribe: noop });

  useEffect(() => {
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleWorkbenchChange = (workbenchName) => {
    setShouldShowGraph(false);
    setSelectedWorkbench(
      workbenches.find(({ name }) => workbenchName === name.replaceAll(" ", ""))
    );
  };

  const handleStart = () => {
    clearChart(chart.value);
    const sub = runner
      .runWorkbench(selectedWorkbench.name, iterations.value)
      .subscribe({
        next: ({ name, n, stats }) => {
          addDataToChart(chart.value, {
            datapoint: { x: n, y: stats.median, sem: stats.sem },
            label: name,
          });
        },
        complete: () => {
          setIsRunning(false);
        },
      });
    setSubscription(sub);
    setShouldShowGraph(true);
    setIsRunning(true);
  };

  const handleStop = () => {
    runner.stopWorkbench();
    setIsRunning(false);
  };

  return (
    <div class={c.root}>
      <WorkbenchForm
        onStart={handleStart}
        onStop={handleStop}
        onWorkbenchChange={handleWorkbenchChange}
        selectedWorkbench={selectedWorkbench}
        workbenches={workbenches}
        isRunning={isRunning}
      />
      <sl-card class={cn(c.graphCard, { [c.hidden]: !shouldShowGraph })}>
        <Chart
          chartSig={chart}
          hide={!shouldShowGraph}
          title={selectedWorkbench && selectedWorkbench.name}
        />
      </sl-card>
    </div>
  );
};

export default Race;
