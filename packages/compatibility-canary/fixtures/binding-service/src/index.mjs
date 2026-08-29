export default {
  async fetch(request) {
    const message = new URL(request.url).searchParams.get("message") ?? "binding-missing";
    return Response.json({ message });
  },
};
