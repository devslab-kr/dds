import {useState} from 'react';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,it} from 'vitest';
import {DatePicker} from '../index';

it('selects controlled dates, clears selection and dismisses by keyboard',async()=>{
  function Example(){const [date,setDate]=useState('2026-10-12');return <DatePicker label="날짜" value={date} onChange={setDate}/>;}
  const user=userEvent.setup();render(<Example/>);
  expect(screen.getByLabelText('날짜')).toHaveValue('2026/10/12');
  await user.click(screen.getByRole('button',{name:'날짜 달력 열기'}));
  await user.click(screen.getByRole('button',{name:'2026년 10월 13일 화요일 선택'}));
  await waitFor(()=>expect(screen.getByLabelText('날짜')).toHaveValue('2026/10/13'));
  await user.click(screen.getByRole('button',{name:'날짜 달력 열기'}));
  await user.click(screen.getByRole('button',{name:'선택 날짜 지우기'}));
  await waitFor(()=>expect(screen.getByLabelText('날짜')).toHaveValue(''));
  await user.click(screen.getByRole('button',{name:'날짜 달력 열기'}));
  await user.keyboard('{Escape}');
  await waitFor(()=>expect(screen.queryByRole('application')).not.toBeInTheDocument());
});

it('disables the input and trigger together',()=>{
 render(<DatePicker label="날짜" value="" onChange={()=>{}} disabled/>);
 expect(screen.getByLabelText('날짜')).toBeDisabled();
 expect(screen.getByRole('button',{name:'날짜 달력 열기'})).toBeDisabled();
});
