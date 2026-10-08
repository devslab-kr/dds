import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { Button, Checkbox, Dialog, Field, RadioGroup, Select, Switch, Tab, TabList, TabPanel, Tabs, ToastProvider, Tooltip, useToast } from "../src";
import "../styles.css";

function SecondaryActions() {
  const toast = useToast();
  return <Button onClick={() => toast.show({ message: "Secondary notification", duration: 0 })}>Show secondary toast</Button>;
}

function Content() {
  const [open, setOpen] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);
  const toast = useToast();
  return <>
    <h1>DDS Ark verification</h1>
    <Tabs defaultValue="one"><TabList><Tab value="one">First tab</Tab><Tab value="two" disabled={disabled()}>Second tab</Tab><Tab value="three">Third tab</Tab></TabList><TabPanel value="one"><input aria-label="Retained note" /></TabPanel><TabPanel value="two">Second panel</TabPanel><TabPanel value="three">Third panel</TabPanel></Tabs>
    <Button onClick={() => setDisabled(true)}>Disable second tab</Button>
    <form id="controls"><Field label="Country">{(control) => <Select {...control} name="country"><option value="kr">Korea</option></Select>}</Field><Checkbox label="Agree" name="agree" defaultChecked /><Switch label="Enabled" name="enabled" defaultChecked /><RadioGroup label="Choice" name="choice" defaultValue="a" options={[{value:"a",label:"Choice A"},{value:"b",label:"Choice B"}]} /></form>
    <Tooltip content="Keyboard help">{(trigger) => <button {...trigger}>Help trigger</button>}</Tooltip>
    <Button onClick={() => setOpen(true)}>Open dialog</Button>
    <Dialog open={open()} onOpenChange={setOpen} title="Confirmation" description="Keyboard focus stays inside"><Button>First action</Button><Button onClick={() => setOpen(false)}>Close dialog</Button></Dialog>
    <Button onClick={() => toast.show({message:"Saved successfully",duration:2000})}>Show toast</Button>
    <ToastProvider dismissLabel="Close secondary notification" regionLabel="Secondary notifications"><SecondaryActions /></ToastProvider>
  </>;
}
render(() => <ToastProvider dismissLabel="Close notification" regionLabel="Notifications"><Content /></ToastProvider>, document.getElementById("app")!);
