import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs';

function LBAitems(props) {

    const [ShiftHour, setShiftHour] = useState();
    useEffect(() => {
        try {
            // JSON.parse(props.data.ShiftHour)
            setShiftHour(`${dayjs(JSON.parse(props.data.ShiftHour).ShiftStart).format("LT") } to ${dayjs(JSON.parse(props.data.ShiftHour).ShiftEnds).format("LT") }  ${JSON.parse(props.data.ShiftHour).timeZone}`)
            
        }
        catch (e) {
            // console.log(e);
            setShiftHour(props.data.ShiftHour)
        }
    }, []);
    return (
        
            <tr class="bg-white border-b ">
                <th class="px-6 py-4 w-5 whitespace-nowrap font-normal" >
                    {props.data.date}
                </th>
                <td class="px-2 py-4 flex items-center ">
                    <img src={`/Avatar/` + props.data.pp} alt="" className='rounded-full w-10 h-10' />
                    <div className='ml-3'>{props.data.user}</div>

                </td>
                
                <td class="px-2 py-4 mt-0">
                    <div className="flex flex-col">
                        <div>
                        {ShiftHour}

                        </div>
                        {props.data.files?
                        <a className='text-xs text-[#01b6ee] underline' href={import.meta.env.VITE_REACT_APP_BASE_URL+props.data.files}>Approval</a>
                    :<></>}
                    </div>
                </td>
                
            </tr>

        
    )
}

export default LBAitems