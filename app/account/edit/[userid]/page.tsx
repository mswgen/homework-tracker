'use client';

import Image from "next/image";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "usehooks-ts";

import { LSAccount } from "@/app/types";

const OtherAccountEditpage: React.FC<{ params: { userid: string } }> = ({ params }: { params: { userid: string } }) => {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [pwd, setPwd] = useState('');
    const [perm, setPerm] = useState(2);
    const [isAccepted, setIsAccepted] = useState(false);
    const [saveState, setSaveState] = useState('');
    const [saveErrorMsg, setSaveErrorMsg] = useState('');
    const [myPerm, setMyPerm] = useState(2);
    const [isOffline, setIsOffline] = useState(false);

    const [account, setAccount] = useLocalStorage<LSAccount | null>('account', null);

    useEffect(() => {
        setIsClient(true);
    }, []);
    useEffect(() => {
        if (!isClient) return;
        fetch('/api/account?id=' + decodeURIComponent(params.userid)).then(async res => {
            if (res.ok) {
                const data = (await res.json()).data;
                setFirstName(data.firstName);
                setLastName(data.lastName);
                setPerm(data.perm);
                setIsAccepted(data.accepted || false);
            } else {
                router.replace('/');
            }
        }).catch(() => {
            setIsOffline(true);
        })
    }, [isClient, router, params.userid, isOffline]);
    useEffect(() => {
        if (isOffline) {
            const interval = setInterval(() => {
                fetch('/api/is_online').then(() => {
                    setIsOffline(false);
                }).catch(() => {
                    setIsOffline(true);
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isOffline]);
    useEffect(() => {
        if (account && account.id && account.token) {
            fetch('/api/account?id=' + account.id).then(async res => {
                if (res.ok) {
                    setMyPerm((await res.json()).data.perm);
                } else {
                    setAccount(null);
                    router.replace('/login/id');
                }
            }).catch(() => {
                setIsOffline(true);
            })
        } else {
            router.replace('/login/id');
        }
    }, [account, router, setAccount]);
    useEffect(() => {
        document.documentElement.style.setProperty("--viewport-width", ((document.querySelector('main') as HTMLElement).clientWidth / 9 * 10).toString());
        return () => document.documentElement.style.setProperty("--viewport-width", "100vw");
    });

    return isOffline ? (
        <>
            <Image src="/offline.svg" alt="오프라인 상태" width={150} height={150} className="mt-2 mb-8 ml-auto mr-auto dark:invert" />
            <h2>오프라인 상태입니다.</h2>
            <p>계정 정보를 수정하려면 인터넷 연결이 필요합니다.</p>
        </>
    ) : (
        <>
            <div>
                <div className="grid grid-cols-[auto_auto_1fr]">
                    <button onClick={(e) => {
                        e.preventDefault();
                        router.back();
                    }}><Image src="/back.svg" alt="뒤로가기" height={36} width={36} className="relative mt-[.125rem] dark:invert w-9 h-9" /></button>
                    <h1 className="text-3xl ml-4">계정 정보 수정하기</h1>
                    <div></div>
                </div>
                <br />
                <h1 className="text-5xl">{isClient ? decodeURIComponent(params.userid) : ''}</h1>
                <br />
                <span className={`text-right float-right whitespace-pre-line ${saveState === '저장됨' && 'text-green-500'} ${saveState === '저장 실패' && 'text-red-500'}`} >{saveState}{saveState === '저장 실패' && `\n${saveErrorMsg}`}</span>
                <br />
                <br />
                <label htmlFor="name">이름</label>
                <br />
                <input type="text" id="firstName" value={firstName} disabled={myPerm !== 0} className="border border-slate-400 h-12 rounded-lg p-4 mr-[5%] w-[45%] dark:bg-[#424242]" onChange={e => {
                    setFirstName(e.currentTarget.value);
                    setSaveState('저장 중');
                    fetch('/api/account', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: account!.token! },
                        body: JSON.stringify({
                            id: decodeURIComponent(params.userid),
                            firstName: e.currentTarget.value
                        })
                    }).then(async res => {
                        if (res.ok) {
                            setSaveState('저장됨');
                        } else {
                            setSaveState('저장 실패');
                            setSaveErrorMsg((await res.json()).msg);
                        }
                    }).catch(() => {
                        setSaveState('저장 실패');
                        setSaveErrorMsg('오프라인 상태');
                    });
                }} />
                <input type="text" id="lastName" value={lastName} disabled={myPerm !== 0} className="border border-slate-400 h-12 rounded-lg p-4 ml-[5%] w-[45%] dark:bg-[#424242]" onChange={e => {
                    setLastName(e.currentTarget.value);
                    setSaveState('저장 중');
                    fetch('/api/account', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: account!.token! },
                        body: JSON.stringify({
                            id: decodeURIComponent(params.userid),
                            lastName: e.currentTarget.value
                        })
                    }).then(async res => {
                        if (res.ok) {
                            setSaveState('저장됨');
                        } else {
                            setSaveState('저장 실패');
                            setSaveErrorMsg((await res.json()).msg);
                        }
                    }).catch(() => {
                        setSaveState('저장 실패');
                        setSaveErrorMsg('오프라인 상태');
                    });
                }} />
                <br />
                <br />
                <label htmlFor="pwd">비밀번호 변경</label>
                <br />
                <input type="password" id="pwd" autoComplete="new-password" value={pwd} className="border border-slate-400 h-12 rounded-lg p-4 w-[70%] dark:bg-[#424242]" onChange={e => {
                    setPwd(e.currentTarget.value);
                }} />
                <button className="w-[20%] ml-[10%] mr-0 pt-3 pb-3 mt-4 rounded-lg bg-blue-500 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:hover:bg-gray-500 dark:disabled:hover:bg-gray-700 transition-all ease-in-out duration-200 focus:ring" onClick={e => {
                    e.preventDefault();
                    setSaveState('저장 중');
                    fetch('/api/account', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: account!.token! },
                        body: JSON.stringify({
                            id: decodeURIComponent(params.userid),
                            pwd
                        })
                    }).then(async res => {
                        if (res.ok) {
                            setSaveState('저장됨');
                        } else {
                            setSaveState('저장 실패');
                            setSaveErrorMsg((await res.json()).msg);
                        }
                    }).catch(() => {
                        setSaveState('저장 실패');
                        setSaveErrorMsg('오프라인 상태');
                    });
                }}>변경</button>
                <br />
                <br />
                <label htmlFor="perm">권한</label>
                <br />
                <select value={perm} id="perm" disabled={myPerm !== 0} className="border border-slate-400 h-12 rounded-lg pl-4 pr-4 w-[100%] dark:bg-[#424242]" onChange={e => {
                    setPerm(parseInt(e.currentTarget.value));
                    setSaveState('저장 중');
                    fetch('/api/account', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: account!.token! },
                        body: JSON.stringify({
                            id: decodeURIComponent(params.userid),
                            perm: parseInt(e.currentTarget.value)
                        })
                    }).then(async res => {
                        if (res.ok) {
                            setSaveState('저장됨');
                        } else {
                            setSaveState('저장 실패');
                            setSaveErrorMsg((await res.json()).msg);
                        }
                    }).catch(() => {
                        setSaveState('저장 실패');
                        setSaveErrorMsg('오프라인 상태');
                    });
                }}>
                    <option value={0}>root</option>
                    <option value={1}>admin</option>
                    <option value={2}>user</option>
                </select>
                <br />
                <br />
                <label htmlFor="accepted">상태</label>
                <br />
                <input type="checkbox" id="accepted" checked={isAccepted} disabled={myPerm !== 0} className="mr-2" onChange={e => {
                    setIsAccepted(e.currentTarget.checked);
                    setSaveState('저장 중');
                    fetch('/api/account', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: account!.token! },
                        body: JSON.stringify({
                            id: decodeURIComponent(params.userid),
                            accepted: e.currentTarget.checked
                        })
                    }).then(async res => {
                        if (res.ok) {
                            setSaveState('저장됨');
                        } else {
                            setSaveState('저장 실패');
                            setSaveErrorMsg((await res.json()).msg);
                        }
                    }).catch(() => {
                        setSaveState('저장 실패');
                        setSaveErrorMsg('오프라인 상태');
                    });
                }} />
                <span className="text-xl">{isAccepted ? '승인됨' : '승인되지 않음'}</span>
            </div>
        </>
    );
}

export default OtherAccountEditpage;