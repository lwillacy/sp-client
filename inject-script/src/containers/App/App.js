import React, { useState, useEffect } from "react"

import axios from "axios"
import ChatboxIframe from "../ChatboxIframe"
import Rooms from "../Rooms"
import Danmus from "../Danmus"

import storageManager from "storage"
import config from "config"
// import AccountContext from "context/account"

// import { getUrl, getDomain } from "utils"

function App() {
	// wait for localStorage finish loading before rendering anything
	// ready can only change from false to true for one time!
	const [account, setAccount] = useState(null)
	const [ready, setReady] = useState(false)
	const [chatboxCreated, setChatboxCreated] = useState(false)
	const [storageData, setStorageData] = useState()
	const [socket, setSocket] = useState(null)

	// can't use 'connected' to trigger reconnection with useEffect
	// since connected is also set in useEffect, it causes infinite loop
	const [disconnectedCounter, setDisconnectedCounter] = useState(0)
	// const [socketIsLoggedIn, setSocketIsLoggedIn] = useState(false)

	const token = account && account.token
	useEffect(() => {
		// Load everything from localStorage
		// register all localstorage listeners
		storageManager.addEventListener("account", (account) => {
			setAccount(account)
		})
		// pass null as storage key to get all stored data
		storageManager.get(null, (data) => {
			setStorageData(data)
			if (data.account) {
				setAccount(data.account)
			}
		})

		window.addEventListener(
			"message",
			(e) => {
				if (!e || !e.data) return
				const data = e.data

				if (data.action === "update_storage") {
					storageManager.set(data.key, data.value)
				}
				// if (data.action === "chat_message") {
				// 	window.queueDanmu(data.data)
				// }
				// console.log("hh", data)
				// data should go in one direction - iframe to parent frame
				// if (data.action === "sp-parent-data") {
				// 	spDebug("post config & account to chatbox")
				// 	postMsgToIframe("sp-parent-data", {
				// 		spConfig: spConfig,
				// 		// pass account to chatbox to get the latest token
				// 		account: accountManager.getAccount(),
				// 		blacklist: blacklistRef.current
				// 	})
				// }
			},
			false
		)

		setReady(true)
	}, [])

	useEffect(() => {
		// if (!chatboxCreated && token) {
		if (token) {
			console.debug("creating socket")
			const s = new WebSocket(config.socketUrl)
			window.spSocket = s
			const socketOpenHandler = () => {
				console.debug("socket connected")
				// setConnected(true)
				s.wasConnected = true

				const socketPayload = {
					action: "login",
					data: {
						token: token,
					},
				}
				s.send(JSON.stringify(socketPayload))
			}
			const socketCloseHandler = () => {
				if (s.wasConnected) {
					// Show error to user only if it was connected before
					// Otherwise when there is no Internet, this will show
					// repeatedly
					console.error("聊天服务器连接断开！")
				}
				s.closed = true
				// setConnected(false)
				setDisconnectedCounter((counter) => {
					return counter + 1
				})
				setSocket(null)
				console.debug("socket disconnected")
			}
			const socketMessageHandler = (e) => {
				const msg = JSON.parse(e.data)
				if (msg.name === "login") {
					if (msg.success) {
						console.debug("聊天服务器登录成功!")
						setSocket(s)
						// setSocketIsLoggedIn(true)
					} else {
						// delete account data to force user re-login
						storageManager.set("account", null)
					}
				}

				if (msg.error) {
					console.error(msg.error)
				}
			}

			s.addEventListener("open", socketOpenHandler)
			s.addEventListener("close", socketCloseHandler)
			s.addEventListener("message", socketMessageHandler)

			// setSocket(s)

			return () => {
				window.spSocket = null
				// unregister callbacks
				s.removeEventListener("open", socketOpenHandler)
				s.removeEventListener("close", socketCloseHandler)
				s.removeEventListener("message", socketMessageHandler)
				if (!s.closed) {
					s.close()
					s.closed = true
				}
				setSocket(null)
				// setConnected(false)
				// setSocketIsLoggedIn(false)
			}
		}
	}, [disconnectedCounter, token])

	useEffect(() => {
		console.info("token changed", token)
		if (token) {
			axios.defaults.headers.common["token"] = token
		} else {
			delete axios.defaults.headers.common["token"]
		}
	}, [token])

	return (
		<>
			{/* <ChatboxIframe blacklist={blacklist} /> */}
			<ChatboxIframe
				chatboxCreated={chatboxCreated}
				setChatboxCreated={setChatboxCreated}
			/>
			<Danmus />
			{ready && (
				<Rooms
					storageData={storageData}
					socket={socket}
					// socket={socketIsLoggedIn ? socket : null}
				/>
			)}
		</>
	)
}

export default App
