'use client';

import { formatDistanceStrict, formatDistanceToNowStrict } from "date-fns";
import { ko } from "date-fns/locale";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import Image from "next/image";
import Link from "next/link";
import Dialog from '@/app/dialog';

import { deadlineName, postType, LSAccount } from "@/app/types";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "usehooks-ts";

function Tag({ category, className }: { category: number, className?: string }) {
    return (
        <span className={`rounded-lg bg-blue-500 p-1 h-8 text-white ${className}`}>
            #{postType[category] || '기타'}
        </span>
    )
}

function CreatedTime({ post }: { post: { count: number, title: string, type: number, content: string, deadline?: Date, created: Date, author: { id: string, firstName?: string, lastName?: string } } }) {
    const [tick, setTick] = useState<number>(0);
    useEffect(() => {
        const timeout = setTimeout(() => {
            setTick(tick + 1);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [tick]);

    return <h3 className="text-xl">{post.author.id}{post.author.firstName && post.author.lastName && ` (${post.author.firstName} ${post.author.lastName})`} | {formatDistanceToNowStrict(new Date(post.created), { locale: ko, addSuffix: true })}</h3>;
}

function ToDeadLine({ post }: { post: { count: number, title: string, type: number, content: string, deadline?: Date, created: Date, author: { id: string, firstName?: string, lastName?: string } } }) {
    const [tick, setTick] = useState<number>(0);
    useEffect(() => {
        const timeout = setTimeout(() => {
            setTick(tick + 1);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [tick]);

    return (
        <p className={`${post.deadline && (post.deadline as unknown as number - 0) >= new Date().setHours(0, 0, 0, 0) && (post.deadline as unknown as number - 0) - new Date().setHours(0, 0, 0, 0) <= 1000 * 60 * 60 * 24 * 2 && 'text-red-500'}`}>{deadlineName[post.type ?? 5]}: {post.deadline ? `${(post.deadline as unknown as number - 0) == new Date().setHours(0, 0, 0, 0) ? '오늘' : formatDistanceStrict(post.deadline, new Date(new Date().setHours(0, 0, 0, 0)), { locale: ko, addSuffix: true })}(${post.deadline.toLocaleDateString('ko-KR', {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        })})` : '없음'}</p>
    );
}

function ImageModal({ src, children }: { src: string, children: React.ReactNode }) {
    const [displayed, setDisplayed] = useState(false);

    return (
        <>
            <button className="block" onClick={e => setDisplayed(true)}>
                {children}
            </button>
            {displayed &&
                <button className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50" onClick={e => setDisplayed(false)}>
                    <div className="fixed top-[50%] left-[50%] transform translate-x-[-50%] translate-y-[-50%] z-50">
                        <Link href={src} target="_blank"><Image src={src} alt={src} width={5000} height={5000} className="w-[80vw]" /></Link>
                    </div>
                </button>
            }
        </>
    );
}

export default function Post({ params }: { params: { idx: string } }) {
    const router = useRouter();

    const [post, setPost] = useState<{ count: number, title: string, type: number, content: string, deadline?: Date, created: Date, author: { id: string, firstName?: string, lastName?: string } }>({ count: 0, title: '', type: 4, content: '', deadline: undefined, created: new Date(1970, 0, 1, 9, 0, 0), author: { id: '' } });
    const [perm, setPerm] = useState(2);
    const [isCopied, setIsCopied] = useState(false);
    const [lastCopied, setLastCopied] = useState(0);
    const [dialogTtile, setDialogTitle] = useState<string>('');
    const [dialogType, setDialogType] = useState<'alert' | 'confirm'>('alert');
    const [dialogContent, setDialogContent] = useState<string>('');
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [dialogCallback, setDialogCallback] = useState<{ callback: (result: boolean) => void }>({ callback: () => { } });

    const [account, setAccount] = useLocalStorage<LSAccount | null>('account', null);

    useEffect(() => {
        document.documentElement.style.setProperty("--viewport-width", ((document.querySelector('main') as HTMLElement).clientWidth / 9 * 10).toString());
        return () => document.documentElement.style.setProperty("--viewport-width", "100vw");
    });
    useEffect(() => {
        if (!account || !account.token) router.replace('/');
        else fetch(`/api/post/${Number(params.idx)}`, {
            method: 'GET',
            headers: {
                Authorization: account.token
            }
        }).then(response => {
            if (!response.ok) {
                router.replace('/');
            } else {
                response.json().then(data => {
                    setPost({ ...data, deadline: data.deadline ? new Date(data.deadline) : null });
                })
            }
        })
    }, [params.idx, router, account]);
    useEffect(() => {
        fetch(`/api/account?id=${account?.id}`).then(res => {
            if (!res.ok) {
                setAccount(null);
                router.replace('/login/id');
            } else {
                res.json().then(data => {
                    setPerm(data.data.perm);
                })
            }
        })
    }, [account, router, setAccount]);
    useEffect(() => {
        if (!isCopied) return;
        const timeout = setTimeout(() => {
            setIsCopied(false);
        }, 2000);
        return () => clearTimeout(timeout);
    }, [lastCopied, isCopied]);

    return (
        <>
            <div className="border-b-slate-400 border-b">
                <div className="grid grid-cols-[auto_auto_1fr]">
                    <h1 className="text-4xl">{post.title}</h1>
                    <Tag category={Number(post.type) ?? 5} className="mt-auto mb-auto ml-2" />
                    <span></span>
                </div>
                <ToDeadLine post={post} />
                <br />
                <div className="grid grid-cols-[auto_1fr_auto]">
                    <CreatedTime post={post} />
                    <span></span>
                    <button onClick={() => {
                        if ('clipboard' in navigator) {
                            navigator.clipboard.writeText(location.href).then(() => {
                                setIsCopied(true);
                                setLastCopied(Date.now());
                            }).catch(() => {
                                setDialogType('alert');
                                setDialogTitle('클립보드에 복사할 수 없음');
                                setDialogContent('이 브라우저는 클립보드에 복사 기능을 지원하지만 알 수 없는 오류로 인해 현재 복사할 수 없습니다.\n아래 링크를 수동으로 복사해주세요.\n\n' + location.href);
                                setShowDialog(true);
                            });
                        } else {
                            setDialogType('alert');
                            setDialogTitle('클립보드 미지원 브라우저');
                            setDialogContent('이 브라우저는 현재 클립보드에 복사 기능을 지원하지 않습니다.\n아래 링크를 수동으로 복사해주세요.\n\n' + location.href);
                            setShowDialog(true);
                        }
                    }}>
                        {isCopied ?
                            <Image src="/check.svg" alt="시간표 링크 복사하기" width={24} height={24} className="dark:invert max-w-8 max-h-8" />
                            : <Image src="/copy.svg" alt="시간표 링크 복사하기" width={24} height={24} className="dark:invert max-w-8 max-h-8" />
                        }
                    </button>
                </div>
                <br />
            </div>
            <div className="border-b border-b-slate-300">
                <br />
                <Markdown remarkPlugins={[remarkGfm]} components={{
                    // @ts-ignore
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                            // @ts-ignore
                            <SyntaxHighlighter
                                language={match[1]}
                                PreTag="div"
                                {...props}
                                style={materialDark}
                            >
                                {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                        ) : (
                            <code {...props}>{children}</code>
                        );
                    },
                    img: (image) => (
                        <ImageModal src={image.src || ""}>
                            <Image
                                src={image.src || ""}
                                alt={image.alt || ""}
                                width={600}
                                height={600}
                                className="w-[200px] sm:w-[250px] md:w-[300px] lg:w-[400px] xl:w-[500px] 2xl:w-[600px] h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px] xl:h-[500px] 2xl:h-[600px] object-cover"
                            />
                        </ImageModal>
                    ),
                    a: (link) => (
                        <Link href={link.href || ""} rel="noopener noreferrer" target="_blank">{link.children}</Link>
                    )
                }} className="prose dark:prose-invert">{post.content}</Markdown>
                <br />
            </div>
            <br />
            {(perm <= 1 || account?.id === post.author.id) &&
                <>
                    <Link href={`/write/${params.idx}`}>
                        <button className="ml-[40%] w-[25%] mr-0 pt-3 pb-3 mt-0 rounded-lg bg-blue-500 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:hover:bg-gray-500 dark:disabled:hover:bg-gray-700 transition-all ease-in-out duration-200 focus:ring">수정</button>
                    </Link>
                    <button className="ml-[10%] w-[25%] mr-0 pt-3 pb-3 mt-0 rounded-lg bg-red-500 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:hover:bg-gray-500 dark:disabled:hover:bg-gray-700 transition-all ease-in-out duration-200 focus:ring" onClick={e => {
                        fetch(`/api/post/${Number(params.idx)}`, {
                            method: 'DELETE',
                            headers: {
                                Authorization: account!.token!
                            }
                        }).then(response => {
                            if (response.ok) router.push('/');
                            else alert('삭제에 실패했습니다.');
                        })
                    }}>삭제</button>
                </>
            }
            {showDialog && <Dialog title={dialogTtile} content={dialogContent} type={dialogType} setShowDialog={setShowDialog} callback={dialogCallback.callback} />}
        </>
    );
}
