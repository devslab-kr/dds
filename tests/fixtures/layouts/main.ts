const query = new URLSearchParams(location.search),
  framework = query.get("framework"),
  position = query.get("layout") === "top" ? "top" : "left";
if (framework) {
  document.body.innerHTML = '<div id="app"></div>';
  const target = document.getElementById("app")!;
  if (framework === "react") (await import("./react")).start(target, position);
  else if (framework === "solid")
    (await import("./solid")).start(target, position);
  else if (framework === "vue") {
    const { createApp } = await import("vue");
    const { default: App } = await import("./vue.vue");
    createApp(App, { navigationPosition: position }).mount(target);
  } else if (framework === "svelte") {
    const { mount } = await import("svelte");
    const { default: App } = await import("./svelte.svelte");
    mount(App, { target, props: { navigationPosition: position } });
  }
}
