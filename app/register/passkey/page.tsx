'use client';

import Link from 'next/link';

import { startRegistration } from '@simplewebauthn/browser';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "usehooks-ts";

import { LSAccount, LSNewAccount } from "@/app/types";

export default function RegisterPasskey() {
    const router = useRouter();

    const [errorMsg, setErrorMsg] = useState('');
    const [errorCnt, setErrorCnt] = useState(0);
    const [account, setAccount] = useLocalStorage<LSAccount | null>('account', null);
    const [newAccount, setNewAccount] = useLocalStorage<LSNewAccount | null>('newAccount', null);

    useEffect(() => {
        if (!account || !account.token) {
            router.replace('/login');
        }
    }, [router, account]);
    useEffect(() => {
        if (window.PublicKeyCredential &&
            PublicKeyCredential.isConditionalMediationAvailable) {
            PublicKeyCredential.isConditionalMediationAvailable().then(result => {
                if (!result) router.replace('/');
            });
        }
    }, [router]);

    return (
        <div className="w-full lg:w-[80%] md:grid md:grid-cols-2 md:gap-2 ml-auto mr-auto">
            <div className="mb-4 lg:mt-24">
                <h1 className="text-3xl">패스키 추가하기</h1>
            </div>
            <div className="lg:mt-24">
                <p>패스키를 사용하면 비밀번호 없이 안전하게 로그인할 수 있습니다.</p>
                <p>아래 버튼을 클릭해 패스키를 생성하세요.</p>
                <br />
                <Link href="/">
                    <input type="button" value="건너뛰기" className={`w-[40%] ml-0 ${errorCnt < 3 ? 'hidden' : ''}`} />
                </Link>
                <button className={`ml-[${errorCnt < 3 ? '60' : '20'}%] w-[40%] mr-0 pt-3 pb-3 mt-4 rounded-lg bg-blue-500 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:hover:bg-gray-500 dark:disabled:hover:bg-gray-700 transition-all ease-in-out duration-200 focus:ring`} onClick={async e => {
                    setErrorMsg('');
                    fetch('/api/passkey/register/prepare', {
                        method: 'GET',
                        headers: {
                            Authorization: account!.token!
                        }
                    }).then(res => {
                        res.json().then(async data => {
                            let attResp;
                            try {
                                attResp = await startRegistration(data.options);
                                console.log('registered')
                                const verificationResp = await fetch('/api/passkey/register', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: account!.token!
                                    },
                                    body: JSON.stringify(attResp),
                                });
                                if (verificationResp.ok) {
                                    router.push('/');
                                } else {
                                    setErrorMsg('패스키 생성 중 오류가 발생했습니다.');
                                    setErrorCnt(errorCnt + 1);
                                }
                            } catch (e: any) {
                                if (e.name === 'InvalidStateError') {
                                    setErrorMsg('이미 등록된 패스키입니다.');
                                    setErrorCnt(errorCnt + 1);
                                } else if (e.name === 'NotAllowedError') {
                                    setErrorMsg('패스키 등록이 취소되었습니다.');
                                } else {
                                    setErrorMsg('패스키 생성 중 오류가 발생했습니다. ' + e.message);
                                    setErrorCnt(errorCnt + 1);
                                }
                            }
                        });
                    });
                }}>패스키 생성하기</button>
                <br />
                {errorMsg !== '' && <p className="text-red-500">{errorMsg}</p>}
            </div>
        </div>
    );
}