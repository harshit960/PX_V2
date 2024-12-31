import React, { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import { Calendar, dayjsLocalizer } from 'react-big-calendar'
import dayjs from 'dayjs'
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useProjectsContext } from '../context/ProjectsProvider';

import { useOBContext } from '../context/OBProvider';

function CalendarPage() {
    const localizer = dayjsLocalizer(dayjs)
    const token = localStorage.getItem('jwt');
    const [archive, setarchive] = useState([]);
    const { Projects, setProjects } = useProjectsContext();
    const { OB, setOB } = useOBContext();

    useEffect(() => {
        getUser()
    }, [])

    const getUser = async () => {

        let url = import.meta.env.VITE_REACT_APP_BASE_URL + "/leaderboard";
        console.log(url);
        let data = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        let passedData = await data.json();

        setarchive(passedData);
    }
    const [eventsList, seteventsList] = useState([]);
    useEffect(() => {
        console.log(archive);
        const events = archive.map(item => {
            if (item.dateRange ? JSON.parse(item.dateRange).type == "Out Of Office" : false) {

                return {
                    start: dayjs(JSON.parse(item.dateRange).dateRange[0]).toDate(),
                    end: dayjs(JSON.parse(item.dateRange).dateRange[1]).add(1, 'day').toDate(),
                    title: `OOO: ${item.user}`,
                    color: "red"
                };
            }
            if (item.dateRange ? JSON.parse(item.dateRange).type == "On Call" : false) {

                return {
                    start: dayjs(JSON.parse(item.dateRange).dateRange[0]).toDate(),
                    end: dayjs(JSON.parse(item.dateRange).dateRange[1]).add(1, 'day').toDate(),
                    title: `On Call: ${item.user}`,
                    color: "red"
                };
            }
        });
        const additionalEvents = Projects.map(item => {
            return {
                start: dayjs(item.GoLive).toDate(),
                end: dayjs(item.GoLive).toDate(),
                title: `${item.RequestID} GoLive By- ${item.ProjectLead.slice(1)}`,
            };
        });
        console.log(additionalEvents);
        // seteventsList(events.concat(additionalEvents))
        //deploy
        const additionalEvents2 = OB.map(item => {
            return {
                start: dayjs(item.GoLive).toDate(),
                end: dayjs(item.GoLive).toDate(),
                title: `${item.RequestID} GoLive By- ${item.IPOwner}`,
            };
        });

        seteventsList(additionalEvents2.concat(events.concat(additionalEvents)))
    }, [archive, Projects, OB]);
    const customEventPropGetter = event => {
        if (event.color === 'red') {
            return {
                className: 'text-red-500',
                style: {

                    color: '#FF0000' // This will change the text color to black
                },
            };
        } else {
            return {
                style: {
                    color: '#228B22' // This will change the text color to black

                }
            }
        }
    };

    return (
        <div className='flex flex-col h-screen p-16'>
            <Nav />
            <div className='mt-10 mx-20 pb-40'>
                <Calendar
                    localizer={localizer}
                    events={eventsList}
                    startAccessor="start"
                    endAccessor="end"
                    eventPropGetter={customEventPropGetter}
                    style={{ height: 500 }}
                />
            </div>
        </div>
    )
}

export default CalendarPage