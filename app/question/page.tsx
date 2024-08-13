'use client';

import { formatDistanceToNowStrict, sub } from "date-fns";
import { is, ko } from 'date-fns/locale';

import Link from "next/link";
import Dialog from "@/app/dialog";

import { LSAccount, deadlineName } from "@/app/types";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "usehooks-ts";

export default function QuestionList() {
    const [isClient, setIsClient] = useState<boolean>(false);
    const [questions, setQuestions] = useState<Array<{ idx: number, user: string, title: string, created: Date, solved: boolean }>>([]);
    const [canView, setCanView] = useState<boolean>(true);
    const [isOffline, setIsOffline] = useState<boolean>(false);
    const [unsolvedOnly, setUnsolvedOnly] = useState<boolean>(false);
    const router = useRouter();

    const [account, setAccount] = useLocalStorage<LSAccount | null>('account', null);
    const [notification, setNotification] = useLocalStorage<any>('notification', null);

    useEffect(() => {
        setIsClient(true);
    }, []);
    useEffect(() => {
        if (!account || !account.token) router.replace('/');
        else fetch(`/api/question`, {
            method: 'GET',
            headers: {
                Authorization: account.token
            }
        }).then(response => {
            if (!response.ok) {
                router.replace('/');
            }
        })
    }, [router, account]);
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
        document.documentElement.style.setProperty("--viewport-width", ((document.querySelector('main') as HTMLElement).clientWidth / 9 * 10).toString());
        return () => document.documentElement.style.setProperty("--viewport-width", "100vw");
    });
    useEffect(() => {
        if (!account || !account.token) setCanView(false);
        else fetch('/api/question', {
            method: 'GET',
            headers: {
                Authorization: account.token
            }
        }).then(response => {
            if (!response.ok) {
                setCanView(false);
                if (response.status === 401) {
                    setAccount(null);
                    setNotification(null);
                }
            } else {
                setCanView(true);
                response.json().then(data => {
                    setQuestions(data.questions);
                });
            }
        })
    }, [account, setAccount, setNotification]);

    return (
        <>
            {canView && isClient ?
                <>
                    <Link href="/question/write">
                        <button className={`ml-[70%] w-[30%] mr-0 pt-3 pb-3 mt-0 rounded-lg bg-blue-500 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:hover:bg-gray-500 dark:disabled:hover:bg-gray-700 transition-all ease-in-out duration-200 focus:ring`}>질문하기</button>
                    </Link>
                    <br />
                    <input type="checkbox" id="unsolvedOnly" className="mr-2 h-5 mt-1 mb-1" onChange={(e) => {
                        setUnsolvedOnly(e.target.checked);
                    }} />
                    <label htmlFor="unsolvedOnly">미해결 질문만 보기</label>
                    <br />
                    <br />
                    {questions.filter(q => !unsolvedOnly || !q.solved).map((question, idx) => {
                        return (
                            <Link key={idx} href={`/question/${question.idx}`}>
                                <div className="border-t border-t-slate-400">
                                    <br />
                                    <h1 className="text-4xl inline">{question.title}</h1>
                                    <div>{formatDistanceToNowStrict(new Date(question.created), { locale: ko, addSuffix: true })}</div>
                                </div>
                                <br />
                            </Link>
                        );
                    })}
                </>
                : (
                    (account && account.token && isClient) ? (
                        <div className="bg-red-500 p-4 border border-red-500 rounded text-white">
                            <p>관리자의 계정 승인이 필요합니다.</p>
                        </div>
                    ) : (
                        <div className="bg-red-500 p-4 border border-red-500 rounded text-white">
                            <p>로그인이 필요합니다.</p>
                        </div>
                    )
                )
            }
        </>
    );
}
