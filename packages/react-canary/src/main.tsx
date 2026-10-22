import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Checkbox,
  Dialog,
  Field,
  RadioGroup,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  ToastProvider,
  Tooltip,
  useToast,
} from "@devslab/dds-react";
import { ConsoleDemo } from "./console-demo";
import { DataTable } from "@devslab/dds-table-react";
import type { ColDef, GridApi } from "ag-grid-community";
import "@devslab/dds-react/styles.css";
import "@devslab/dds-table-react/styles.css";
import "./style.css";

type Row = { id: string; name: string; amount: number };
const initialRows: Row[] = [
  { id: "b", name: "Beta", amount: 20 },
  { id: "a", name: "Alpha", amount: 10 },
  { id: "c", name: "Gamma", amount: 30 },
];
const columns: ColDef<Row>[] = [
  {
    field: "name",
    headerName: "이름",
    filter: "agTextColumnFilter",
    editable: true,
    width: 200,
    cellRenderer: ({ value }: { value: string }) => <strong>{value}</strong>,
  },
  { field: "amount", headerName: "금액", width: 160 },
];
function Notifications() {
  const toast = useToast();
  return (
    <Button onClick={() => toast.show({ message: "저장 완료", duration: 0 })}>
      알림 표시
    </Button>
  );
}
function App() {
  const [dark, setDark] = useState(false);
  const [outer, setOuter] = useState(false);
  const [inner, setInner] = useState(false);
  const [checked, setChecked] = useState(false);
  const [dense, setDense] = useState(false);
  const [rows, setRows] = useState(initialRows);
  const [api, setApi] = useState<GridApi<Row> | null>(null);
  const [selected, setSelected] = useState(0);
  return (
    <main data-theme={dark ? "dark" : "light"}>
      <h1>DDS React</h1>
      <Button onClick={() => setDark((value) => !value)}>테마 변경</Button>
      <section aria-label="기본 컴포넌트">
        <h2>컴포넌트</h2>
        <Field label="이름" helpText="사용할 이름을 입력하세요">
          {(props) => <input {...props} className="dds-input" />}
        </Field>
        <Checkbox
          label="약관 동의"
          checked={checked}
          onCheckedChange={setChecked}
        />
        <output aria-label="동의 상태">{checked ? "동의" : "미동의"}</output>
        <Switch label="알림 수신" defaultChecked />
        <RadioGroup
          label="언어"
          defaultValue="ko"
          options={[
            { value: "ko", label: "한국어" },
            { value: "en", label: "English" },
          ]}
        />
        <Tabs defaultValue="a">
          <TabList aria-label="작업 영역">
            <Tab value="a">첫째</Tab>
            <Tab value="b">둘째</Tab>
          </TabList>
          <TabPanel value="a">첫째 내용</TabPanel>
          <TabPanel value="b">둘째 내용</TabPanel>
        </Tabs>
        <Tooltip content="추가 설명">
          <Button>설명 보기</Button>
        </Tooltip>
        <Button onClick={() => setOuter(true)}>대화상자 열기</Button>
        <Dialog
          title="바깥 대화상자"
          description="설정을 변경하세요"
          open={outer}
          onOpenChange={setOuter}
        >
          <Button onClick={() => setInner(true)}>안쪽 열기</Button>
          <Dialog title="안쪽 대화상자" open={inner} onOpenChange={setInner}>
            <Button>안쪽 작업</Button>
          </Dialog>
        </Dialog>
        <Notifications />
        <Button>Benachrichtigungseinstellungen speichern</Button>
      </section>
      <section aria-label="테이블 예제">
        <h2>AG Grid Community</h2>
        <Button onClick={() => setDense((value) => !value)}>밀도 변경</Button>
        <Button
          onClick={() =>
            setRows([
              ...rows,
              { id: `d${rows.length}`, name: "Delta", amount: 40 },
            ])
          }
        >
          행 추가
        </Button>
        <Button
          onClick={() =>
            api?.setFilterModel({
              name: { filterType: "text", type: "contains", filter: "Alpha" },
            })
          }
        >
          Alpha 필터
        </Button>
        <Button onClick={() => api?.setFilterModel(null)}>필터 해제</Button>
        <output aria-label="선택 수">{selected}</output>
        <DataTable
          rows={rows}
          columns={columns}
          label="DDS 고객 목록"
          density={dense ? "dense" : "comfortable"}
          placeholder="테이블 준비 중"
          style={{ height: 320 }}
          gridProps={{
            getRowId: (params) => params.data.id,
            rowSelection: { mode: "multiRow" },
            onGridReady: (event) => setApi(event.api),
            onSelectionChanged: (event) =>
              setSelected(event.api.getSelectedRows().length),
          }}
        />
      </section>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider regionLabel="알림 영역" dismissLabel="알림 닫기">
      {window.location.pathname === "/console" ? <ConsoleDemo /> : <App />}
    </ToastProvider>
  </StrictMode>,
);
