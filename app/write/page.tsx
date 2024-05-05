'use client';

import { formatDistanceStrict, formatDistanceToNowStrict } from "date-fns";
import { ko } from "date-fns/locale";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import Image from "next/image";
import Link from "next/link";

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
                        <Link href={src} target="_blank">
                            {(src.startsWith('/') && !src.startsWith('//'))
                                ? <Image src={src} alt={src} width={5000} height={5000} className="w-auto max-w-[90vw] max-h-screen" />
                                // eslint-disable-next-line @next/next/no-img-element
                                : <img src={src} alt={src} className="w-auto max-w-[90vw] max-h-screen" />
                            }
                        </Link>
                    </div>
                </button>
            }
        </>
    );
}

export default function WritePost() {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [type, setType] = useState('4');
    const [hasDeadline, setHasDeadline] = useState(false);
    const [deadline, setDeadline] = useState('');
    const [content, setContent] = useState('');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [preview, setPreview] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [account, setAccount] = useLocalStorage<LSAccount | null>('account', null);

    useEffect(() => {
        document.documentElement.style.setProperty("--viewport-width", ((document.querySelector('main') as HTMLElement).clientWidth / 9 * 10).toString());
        return () => document.documentElement.style.setProperty("--viewport-width", "100vw");
    });
    useEffect(() => {
        if (!account || !account.token) router.replace('/');
        else fetch(`/api/posts`, {
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

    return (
        <>
            <div className="border-b-slate-400 border-b">
                <input type="text" autoFocus id="title" placeholder="제목" className="border border-slate-400 text-4xl rounded-lg p-4 w-[100%] dark:bg-[#424242]" value={title} onChange={e => {
                    setTitle(e.currentTarget.value);
                }} />
                <br /><br />
                <label htmlFor="type">유형:</label>
                <select id="type" className="border border-slate-400 rounded-lg p-2 dark:bg-[#424242] ml-2" value={type} onChange={e => {
                    setType(e.currentTarget.value);
                }}>
                    {
                        Object.keys(postType).filter(key => postType[Number(key)] !== '').map((key) => {
                            return <option key={key} value={key}>{postType[Number(key)]}</option>
                        })
                    }
                </select>
                <input type="checkbox" id="has_deadline" checked={hasDeadline} className="ml-8 mr-2 h-4 w-4" onChange={e => {
                    setHasDeadline(e.currentTarget.checked);
                }} />
                <label htmlFor="deadline">마감 기한: </label>
                <input type="date" id="deadline" className="border border-slate-400 rounded-lg p-2 dark:bg-[#424242] ml-2" disabled={!hasDeadline} value={deadline} onChange={e => {
                    setDeadline(e.currentTarget.value);
                }} />
                <br /><br />
            </div>
            <div>
                <br />
                <div>Discord, GitHub 등에서 사용하는 마크다운 문법이 적용됩니다.</div>
                <br />
                <input type="checkbox" defaultChecked={false} id="preview" className="mr-2 h-4 w-4" onChange={e => {
                    setPreview(e.currentTarget.checked);
                }} />
                <label htmlFor="preview" className="ml-2">미리보기</label>
                <br />
                {preview ?
                    <div className="border border-slate-400 rounded-lg p-4 dark:bg-[#424242]">
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
                            img: (image) => (image.src && image.src.startsWith('/') && !image.src?.startsWith('//')) ? (
                                <ImageModal src={image.src || ""}>
                                    <Image
                                        src={image.src || ""}
                                        alt={image.alt || ""}
                                        width={600}
                                        height={600}
                                        className="w-[200px] sm:w-[250px] md:w-[300px] lg:w-[400px] xl:w-[500px] 2xl:w-[600px] h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px] xl:h-[500px] 2xl:h-[600px] object-cover"
                                    />
                                </ImageModal>
                            ) : (
                                <ImageModal src={image.src || ""}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={image.src || ""}
                                        alt={image.alt || ""}
                                        width={600}
                                        height={600}
                                        className="w-[200px] sm:w-[250px] md:w-[300px] lg:w-[400px] xl:w-[500px] 2xl:w-[600px] h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px] xl:h-[500px] 2xl:h-[600px] object-cover" />
                                </ImageModal>
                            ),
                            a: (link) => (
                                <Link href={link.href || ""} rel="noopener noreferrer" target="_blank">{link.children}</Link>
                            )
                        }} className="prose dark:prose-invert">{content}</Markdown>
                    </div>
                    : <textarea cols={64} rows={30} className="resize-none" value={content} onChange={e => {
                        setContent(e.currentTarget.value);
                    }}></textarea>}
            </div>
            <br />
            <button className="mr-[35%] w-[20%] ml-0 pt-3 pb-3 mt-0 rounded-lg bg-blue-500 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:hover:bg-gray-500 dark:disabled:hover:bg-gray-700 transition-all ease-in-out duration-200 focus:ring" disabled={isUploading} onClick={e => {
                e.preventDefault();
                document.getElementById('upload')?.click();
            }}>{isUploading ? '업로드 중' : '파일 업로드'}</button>
            <input type="file" className="hidden" id="upload" onChange={e => {
                e.preventDefault();
                const target = e.currentTarget;
                setIsUploading(true);
                if (!target.files || target.files.length === 0) return;
                const file = target.files[0];
                const formData = new FormData();
                formData.append("file", file);
                fetch(`/api/upload`, {
                    method: 'POST',
                    headers: {
                        Authorization: account!.token!
                    },
                    body: formData
                }).then(response => {
                    setIsUploading(false);
                    e.target.value = '';
                    if (response.ok) {
                        response.json().then(data => {
                            setContent(content + `${content === '' ? '' : '\n'}` + `${file.type.startsWith('image/') ? '!' : ''}[파일 설명을 입력하세요](${data.path})`)
                        })
                    } else {
                        if (response.status === 413) {
                            setErrorMsg(`${process.env.NEXT_PUBLIC_UPLOAD_LIMIT_MIB}MB 이하의 파일만 업로드할 수 있습니다.`);
                        } else {
                            response.json().then(data => {
                                setErrorMsg(data.msg);
                            });
                        }
                    }
                });
            }} />
            <button className="ml-[35%] w-[10%] mr-0 pt-3 pb-3 mt-0 rounded-lg bg-blue-500 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:hover:bg-gray-500 dark:disabled:hover:bg-gray-700 transition-all ease-in-out duration-200 focus:ring" disabled={title === '' || content === '' || (hasDeadline && deadline === '')} onClick={e => {
                e.preventDefault();
                const target = e.currentTarget;
                target.disabled = true;
                if (!title || !content) return;
                if (hasDeadline && deadline === '') return;
                fetch(`/api/posts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: account!.token!
                    },
                    body: JSON.stringify({
                        title,
                        type: Number(type),
                        deadline: hasDeadline ? new Date(Number(deadline.split('-')[0]), Number(deadline.split('-')[1]) - 1, Number(deadline.split('-')[2])) : null,
                        content
                    })
                }).then(response => {
                    if (response.ok) {
                        response.json().then(data => {
                            router.push(`/post/${data.count}`);
                        })
                    } else {
                        target.disabled = false;
                        response.json().then(data2 => {
                            setErrorMsg(data2.msg);
                        });
                    }
                });
            }}>확인</button>
            {errorMsg !== '' && <div className="text-red-500">{errorMsg}</div>}
        </>
    );
}
