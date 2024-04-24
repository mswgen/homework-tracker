'use client';

import { formatDistanceStrict, sub } from "date-fns";
import { is, ko } from 'date-fns/locale';

import Link from "next/link";
import Dialog from "@/app/dialog";

import { LSAccount, deadlineName } from "@/app/types";

import { useState, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";

export default function Home() {
  const [posts, setPosts] = useState<Array<{ count: number, title: string, type: number, deadline?: Date }>>([]);
  const [canView, setCanView] = useState<boolean>(true);
  const [isPWA, setIsPWA] = useState<boolean>(false);
  const [dialogTtile, setDialogTitle] = useState<string>('');
  const [dialogType, setDialogType] = useState<'alert' | 'confirm'>('alert');
  const [dialogContent, setDialogContent] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogCallback, setDialogCallback] = useState<{ callback: (result: boolean) => void }>({ callback: () => { } });

  const [account, setAccount] = useLocalStorage<LSAccount | null>('account', null);
  const [notification, setNotification] = useLocalStorage<any>('notification', null);

  useEffect(() => {
    document.documentElement.style.setProperty("--viewport-width", ((document.querySelector('main') as HTMLElement).clientWidth / 9 * 10).toString());
    return () => document.documentElement.style.setProperty("--viewport-width", "100vw");
  });
  useEffect(() => {
    if (!account || !account.token) setCanView(false);
    else fetch('/api/posts', {
      method: 'GET',
      headers: {
        Authorization: account.token
      }
    }).then(response => {
      if (!response.ok) {
        setCanView(false);
      } else {
        setCanView(true);
        response.json().then(data => {
          setPosts(data);
        });
      }
    })
  }, [account]);
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWA(true);
    }
  }, []);
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  return (
    <>
      {canView ?
        <>
          {notification == null ?
            <>
              <button className={`ml-[30%] w-[30%] mr-0 pt-3 pb-3 mt-0 rounded-lg bg-blue-500 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:hover:bg-gray-500 dark:disabled:hover:bg-gray-700 transition-all ease-in-out duration-200 focus:ring`} onClick={async e => {
                if (!('serviceWorker' in navigator)) {
                  setDialogTitle('지원하지 않는 브라우저');
                  setDialogType('alert');
                  setDialogContent('이 브라우저는 알림을 지원하지 않습니다.');
                  setDialogOpen(true);
                  return;
                }
                if (!isPWA) {
                  setDialogTitle('PWA 설치');
                  setDialogType('alert');
                  setDialogContent('알림을 받으려면 PWA 설치가 필요합니다.\n\n컴퓨터에서는 주소창 오른쪽에 있는 아이콘을 클릭하여 설치합니다.\nAndroid Chrome에서는 주소창 오른쪽 메뉴에서 "앱 설치"를 통해 설치합니다.\n삼성 인터넷에서는 주소창 오른쪽 버튼을 통해 설치합니다.\niOS용 Safari에서는 공유-홈 화면에 추가(이 사이트에서는 바로가기 대신 앱이 설치됨)를 눌러 설치합니다.\n\nPWA를 설치한 다음 이를 실행하여 알림 받기를 누르세요.');
                  setDialogOpen(true);
                } else {
                  if (Notification.permission === 'default') {
                    setDialogTitle('알림 설정하기');
                    setDialogType('confirm');
                    setDialogContent('과제 등록, 마감 알림을 받으려면 확인을 누른 다음 알림을 허용해주세요.');
                    setDialogCallback({
                      callback: (result: boolean) => {
                        if (!result) return;
                        Notification.requestPermission().then(async permission => {
                          if (permission === 'granted') {
                            const registration = await navigator.serviceWorker.ready;
                            const subscription = await registration.pushManager.subscribe({
                              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBKEY,
                              userVisibleOnly: true,
                            });
                            await fetch('/api/subscribe', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: account?.token ?? ''
                              },
                              body: JSON.stringify(subscription)
                            }).then(res => {
                              if (!res.ok) {
                                setDialogTitle('알림 구독 실패');
                                setDialogType('alert');
                                setDialogContent('알림 구독에 실패했습니다.');
                              } else {
                                setNotification(subscription);
                              }
                            });
                          } else {
                            setDialogTitle('알림 차단됨');
                            setDialogType('alert');
                            setDialogContent('알림이 차단되었습니다.');
                            setDialogOpen(true);
                          }
                        });
                      }
                    });
                    setDialogOpen(true);
                  } else if (Notification.permission === 'granted') {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.subscribe({
                      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBKEY,
                      userVisibleOnly: true,
                    });
                    await fetch('/api/subscribe', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: account?.token ?? ''
                      },
                      body: JSON.stringify(subscription)
                    }).then(res => {
                      if (!res.ok) {
                        setDialogTitle('알림 구독 실패');
                        setDialogType('alert');
                        setDialogContent('알림 구독에 실패했습니다.');
                      } else {
                        setNotification(subscription);
                      }
                    });
                  } else {
                    setDialogTitle('알림 차단됨');
                    setDialogType('alert');
                    setDialogContent('알림이 차단되어 있어 권한을 요청할 수 없습니다.\n알림을 받기 위해서는 브라우저 설정에서 직접 알림 권한을 허용해주세요.');
                    setDialogOpen(true);
                  }
                }
              }}>알림 받기</button>
              <Link href="/write">
                <button className={`ml-[10%] w-[30%] mr-0 pt-3 pb-3 mt-0 rounded-lg bg-blue-500 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:hover:bg-gray-500 dark:disabled:hover:bg-gray-700 transition-all ease-in-out duration-200 focus:ring`}>글쓰기</button>
              </Link>
            </>
            : <Link href="/write">
              <button className={`ml-[70%] w-[30%] mr-0 pt-3 pb-3 mt-0 rounded-lg bg-blue-500 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:hover:bg-gray-500 dark:disabled:hover:bg-gray-700 transition-all ease-in-out duration-200 focus:ring`}>글쓰기</button>
            </Link>
          }
          <br />
          <br />
          {posts.map((post, idx) => {
            return (
              <Link key={post.count} href={`/post/${post.count}`}>
                <div className="border-t border-t-slate-400">
                  <br />
                  <h1 className="text-4xl">{post.title}</h1>
                  <p className={`${post.deadline && (new Date(post.deadline) as unknown as number - 0) >= new Date().setHours(0, 0, 0, 0) && (new Date(post.deadline) as unknown as number - 0) - new Date().setHours(0, 0, 0, 0) <= 1000 * 60 * 60 * 24 * 2 && 'text-red-500'}`}>{deadlineName[post.type ?? 5]}: {post.deadline ? `${(new Date(post.deadline) as unknown as number - 0) == new Date().setHours(0, 0, 0, 0) ? '오늘' : formatDistanceStrict(new Date(post.deadline), new Date(new Date().setHours(0, 0, 0, 0)), { locale: ko, addSuffix: true })}(${new Date(post.deadline).toLocaleDateString('ko-KR', {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })})` : '없음'}</p>
                </div>
                <br />
              </Link>
            );
          })}
        </>
        : (
          account ? (
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
      {dialogOpen && <Dialog title={dialogTtile} type={dialogType} content={dialogContent} setShowDialog={setDialogOpen} callback={dialogCallback.callback} />}
    </>
  );
}
