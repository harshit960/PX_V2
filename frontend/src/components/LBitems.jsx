import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

function LBitems(props) {
    
    dayjs.extend(utc);
    dayjs.extend(timezone);
    
    const token = localStorage.getItem('jwt');

    const [projectCapacity, setprojectCapacity] = useState(props.data.projectCapacity);
    const [onboard_capacity, setonboard_capacity] = useState(props.data.onboard_capacity);
    const [OBCL, setOBCL] = useState(0);
    const [PCL, setPCL] = useState(0);

    const [x, setx] = useState(0);
    const [y, sety] = useState(0);
    const [projList, setprojList] = useState([]);
    const [OBList, setOBList] = useState([]);
    // fetching to show total assigned ticket data
    const getProj = async () => {

        let url = import.meta.env.VITE_REACT_APP_BASE_URL + "/projects/" + props.data.user;
        let data = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Include the JWT in the Authorization header
                'Authorization': `Bearer ${token}`
            }
        });
        let passedData = await data.json();
        setprojList(passedData);
    }
    const getOB = async () => {

        let url = import.meta.env.VITE_REACT_APP_BASE_URL + "/getOB/" + props.data.user;
        let data = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Include the JWT in the Authorization header
                'Authorization': `Bearer ${token}`
            }
        });
        let passedData = await data.json();
        setOBList(passedData);
    }
    useEffect(() => {
        getProj()
        getOB()
    }, []);

    useEffect(() => {

        for (let i = 0; i < props.OB.length; i++) {
            // console.log(props.OB[i].IPOwner)
            if (props.data.user == props.OB[i].IPOwner) {
                setx(x + 1)
            }
        }
        setOBCL(x)
        for (let i = 0; i < props.Projects.length; i++) {
            // console.log(props.OB[i].IPOwner)
            if (props.data.user == props.Projects[i].ProjectLead) {
                sety(y + 1)
            }
        }
        setPCL(y)

    }, [props]);
    // Manage Change time
    function changeTime() {
        props.settimeDialogBox("")
        props.setUserid(props.data)
        props.setUserName()
    }
    //Function To update 
    async function book() {
        toast("Sync", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: false,
            draggable: false,
            progress: undefined,
            theme: "light"
        })
        if (achieBtn != props.data.achieBtn && achieBtn == "Yes") {
            await fetch(import.meta.env.VITE_REACT_APP_BASE_URL + '/sendEmail', {
                method: 'POST',
                body: JSON.stringify({
                    body: `${props.data.user} has been recognized as the Best Performer of the month! Congratulations! 🏆`
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                    'Authorization': `Bearer ${token}`
                },
            });
        }
        await fetch(import.meta.env.VITE_REACT_APP_BASE_URL + '/updateLB/' + props.data.id, {
            method: 'PUT',
            body: JSON.stringify({
                ShiftHour: props.data.ShiftHour,
                onboard_capacity: onboard_capacity,
                projectCapacity: projectCapacity,
                timeChange: false,
                achieBtn: achieBtn,
                Notes: Notes,
                dateRange: props.data.dateRange
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Authorization': `Bearer ${token}`

            },
        }).then(() => window.location.reload())


    }
    // Handle Sync buttom
    function sync() {

        book()



    }
    // Manage disabled state of input feild
    const [disabled, setdisabled] = useState(true);
    useEffect(() => {


        if (localStorage.getItem('type') == "admin" || props.data.user == localStorage.getItem('name')) {
            setdisabled(false)
        }
    }, []);

    // Handle Shifthour and Archive Fun
    const [ShiftHour, setShiftHour] = useState(props.data.ShiftHour);
    useEffect(() => {
        const obj = JSON.parse(props.data.ShiftHour);
        const shiftStart = dayjs(obj.ShiftStart).tz(obj.timeZone);
        const shiftEnd = dayjs(obj.ShiftEnds).tz(obj.timeZone);
        
        // Get the current time in the specified time zone
        const currentTime = dayjs().tz(obj.timeZone);
        
        // Check if the current time is within the shift period
        if (currentTime.isBefore(shiftEnd)) {
        //   console.log('yes');
        } else {
            setShiftHour(JSON.stringify({"ShiftStart":dayjs().startOf('year'),"ShiftEnds":dayjs().startOf('year'),"timeZone":"CST"}))
        }

    }, [props.data.ShiftHour]);
    // For calculationg topper
    const [Milestone, setMilestone] = useState(0);
    useEffect(() => {

        let beforeETA = 0;

        if (props.data.milestone) {
            JSON.parse(props.data.milestone).forEach((item) => {
                if (item.beforeETA === true) {
                    beforeETA++;
                }
            });
            setMilestone(beforeETA)

        }
    }, [props]);
    const [profileBox, setprofileBox] = useState("scale-x-0 duration-200");
    function handleHoverSet() {
        setprofileBox("scale-x-100 duration-200")
    }
    function handleHoverSet0() {
        setprofileBox("scale-x-0 duration-200")
    }
    useEffect(() => {
        if (props.data.TopPerformer == "Yes") {
            setachieBtnStyle("bg-gray-300  rounded-md")
        } else {
            setachieBtnStyle("")
        }
    }, []);
    const [achieBtnStyle, setachieBtnStyle] = useState();
    const [achieBtn, setachieBtn] = useState(props.data.TopPerformer);
    function handleachieBtn() {
        if (achieBtnStyle == "") {
            setachieBtn("Yes")
            setachieBtnStyle("bg-gray-300  rounded-md")
        }
        else {
            setachieBtn("No")
            setachieBtnStyle("")

        }
    }
    // Handle Notes
    const [Notes, setNotes] = useState(props.data.Notes);
    const [tempNotes, settempNotes] = useState("");
    function handleAddNotes() {
        let NotesObj = Notes ? JSON.parse(Notes) : { notes: [] };
        NotesObj.notes.push(tempNotes);
        let updatedNotes = JSON.stringify(NotesObj);
        setNotes(updatedNotes);
    }
    useEffect(() => {
        if (props.data.Notes != Notes) {
            // send notification for notes
            fetch(import.meta.env.VITE_REACT_APP_BASE_URL + "/newNoti", {
                method: 'POST',
                body: JSON.stringify({
                    userID: props.data.user,
                    msg: `Check Notes in Leaderboard`,
                    assignedBY: localStorage.getItem('name'),
                    onEmail: false

                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                    'Authorization': `Bearer ${token}`
                }
            }).then(() =>
                book(""))
        }

    }, [Notes]);
    const [Notesdilogbox, setNotesdilogbox] = useState("scale-0");
    function deleteNotes(index) {
        let arr = JSON.parse(props.data.Notes).notes
        if (index > -1 && index < arr.length) {
            arr.splice(index, 1);
        }
        let updatedNotes = JSON.stringify({ notes: arr });

        setNotes(updatedNotes);

    }
    return (<>
        <div className={Notesdilogbox}>

            <div className="bg-opacity-20 backdrop-blur-sm bg-black h-screen w-screen fixed z-30 top-0 left-0 flex items-center justify-center">
                <div className="bg-white w-full  border-2 mx-52 rounded flex flex-col items-end">
                    <button onClick={() => setNotesdilogbox("scale-0")} className='justify-right mx-4 py-2'>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>

                    </button>
                    <div className="flex items-start w-full px-4 pb-4">
                        <div className="flex flex-col items-start w-full h-52 overflow-auto">
                            {props.data.Notes ? JSON.parse(props.data.Notes).notes.map((item, index) => (

                                <div className='border-2 my-2 p-2 w-full flex justify-between'>{item}

                                    <button className='text-sm text-red-500' onClick={() => deleteNotes(index)}>

                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>

                                    </button>
                                </div>

                            )) : <>

                                <div className='font-bold my-2 p-2 w-full'></div>
                            </>}

                        </div>
                        <div className="flex flex-col w-96  ">
                            <textarea onChange={(e) => settempNotes(dayjs().format("DD/MM/YY") + ": " + e.target.value)} className="flex flex-col m-2 h-36">

                            </textarea>
                            <button onClick={handleAddNotes} className="flex flex-col m-2 bg-[#01b6ee] rounded h-10 items-center justify-center text-white font-medium">
                                Add Note
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
        <tr className="bg-white border-b text-sm ">
            <th className=''>
                <div className="flex items-center justify-center">

                    {localStorage.getItem('type') == "admin" ?
                        <div className="">
                            <div className={achieBtnStyle} onClick={handleachieBtn}>

                                <img src="\top.png" alt="" srcSet="" className='w-5 rounded-md ' />
                            </div>
                        </div>
                        : <></>
                    }
                </div>

            </th>
            <th className=" font-normal text-center duration-1000 " >
                <div className="flex items-center justify-center" onMouseEnter={handleHoverSet} onMouseLeave={handleHoverSet0}>

                    {props.data.TopPerformer == "Yes" ?
                        <img src="\Performer_Icon.png" alt="" srcSet="" className='w-16 rounded-md ' />
                        : <>
                            {props.index + 1}
                        </>}
                </div>
            </th>
            <div className={profileBox}>

                <div className="absolute drop-shadow-xl	bg-white p-5 rounded -translate-x-16 translate-y-16">
                    <div className="flex flex-col justify-center">
                        <div className="text-sm flex whitespace-nowrap">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mx-1 text-[#01b6ee]">
                                <path fillRule="evenodd" d="M8 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.664.293a.75.75 0 0 1 .428 1.317l-2.791 2.39.853 3.575a.75.75 0 0 1-1.12.814L7.998 12.08l-3.135 1.915a.75.75 0 0 1-1.12-.814l.852-3.574-2.79-2.39a.75.75 0 0 1 .427-1.318l3.663-.293 1.41-3.393A.75.75 0 0 1 8 1.75Z" clipRule="evenodd" />
                            </svg>

                            Total Ticket: {props.data.milestone ? String(JSON.parse(props.data.milestone).length).padStart(2, '0') : "00"}</div>
                        <div className="text-sm flex whitespace-nowrap">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mx-1 text-[#01b6ee]">
                                <path fillRule="evenodd" d="M8 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.664.293a.75.75 0 0 1 .428 1.317l-2.791 2.39.853 3.575a.75.75 0 0 1-1.12.814L7.998 12.08l-3.135 1.915a.75.75 0 0 1-1.12-.814l.852-3.574-2.79-2.39a.75.75 0 0 1 .427-1.318l3.663-.293 1.41-3.393A.75.75 0 0 1 8 1.75Z" clipRule="evenodd" />
                            </svg>

                            Milestone   : {String(Milestone).padStart(2, '0')}</div>
                    </div>
                </div>
            </div>
            <td className="px-6 py-4 flex items-center justify-start">
                <img src={`Avatar/` + props.data.pp} alt="" className='rounded-full w-12 h-12' />
                <div className='ml-3 '>{props.data.user}</div>

            </td>
            <td className=" py-4">
                <div className="flex items-center justify-center">
                    <div>
                        <span>{String(OBList.length).padStart(2, '0')}/</span>
                        <input type="text" disabled={disabled} value={onboard_capacity} className='text-sm w-8 border-0 p-1 ' onChange={(e) => setonboard_capacity(e.target.value)} />
                    </div>
                </div>

            </td>
            <td className=" py-4">
                <div className="flex justify-center">
                    <div>
                        <span>{String(projList.length).padStart(2, '0')}/</span>
                        <input type="text" disabled={disabled} value={projectCapacity} className='text-sm w-8 border-0 p-1' onChange={(e) => setprojectCapacity(e.target.value)} />
                    </div>
                </div>

            </td>
            {/* <td className="px-2 py-4 mt-0">
                <div className="flex justify-center">
                    {localStorage.getItem('type') == 'admin' || props.data.user == localStorage.getItem('name') ?
                        <button onClick={changeTime} className="border-2 h-6 border-[#01b6ee] rounded-md  mx-2 ">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#01b6ee]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button> : <></>}
                    <div className='w-60 flex flex-col text-sm' >
                        {(props.data.dateRange && JSON.parse(props.data.dateRange).type !="" && dayjs().isBetween(dayjs(JSON.parse(props.data.dateRange).dateRange[0]), dayjs(JSON.parse(props.data.dateRange).dateRange[1]).add(1,"day"))) ? JSON.parse(props.data.dateRange).type : dayjs(JSON.parse(ShiftHour).ShiftStart).format("LT") + " to " + dayjs(JSON.parse(ShiftHour).ShiftEnds).format("LT") + " " + JSON.parse(ShiftHour).timeZone}
                       
                        {props.data.files ?
                            <a href={import.meta.env.VITE_REACT_APP_BASE_URL + props.data.files} className='text-xs text-[#01b6ee] underline'>File</a>
                            : <></>}
                    </div>
                </div>
            </td> */}
            
            <td >
                <div class="px-6 py-6 flex items-center justify-center">

                    <button onClick={() => setNotesdilogbox("")}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                </div>
            </td>
            <td>
                {localStorage.getItem('type') == "admin" || props.data.user == localStorage.getItem('name') ?
                    <button onClick={sync} className="border- border-[#01b6ee] rounded-md  mx-2 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#01b6ee]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>

                    </button> : <></>}
            </td>

        </tr>
    </>

    )
}

export default LBitems