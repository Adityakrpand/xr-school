import PlasticMouldingViewer from "./PlasticMouldingViewer";

const meta = {
  title: "Simulations/Plastics Workshop",
  component: PlasticMouldingViewer,
  parameters: {
    layout: "fullscreen",
    a11y: {
      notes:
        "All browser controls have 44px targets, live feedback, narration controls, and point-and-select alternatives to XR controller actions.",
    },
  },
};

export default meta;

export const Default = {};

export const EmptyState = {
  render: () => (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      Plastics Workshop module not started
    </div>
  ),
};

export const LoadingState = {
  render: () => (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      Opening the Plastics Workshop…
    </div>
  ),
};

export const ErrorState = {
  render: () => (
    <div role="alert" style={{ padding: 24 }}>
      The 3D workshop could not start. Reload or continue on a supported browser.
    </div>
  ),
};

export const Mobile = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};

export const StartsGuidedWorkshop = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const startButton = [...canvasElement.querySelectorAll("button")].find(
      (button) =>
        button.textContent?.includes("Enter the virtual moulding workshop"),
    );
    if (!(startButton instanceof HTMLButtonElement)) {
      throw new Error("Workshop start button was not rendered");
    }
    startButton.click();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    if (!canvasElement.textContent?.includes("The unfinished materials display")) {
      throw new Error("Guided workshop did not start");
    }
  },
};
