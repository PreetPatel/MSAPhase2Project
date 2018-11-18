import * as React from 'react';
import * as Webcam from "react-webcam";
import Modal from 'react-responsive-modal';
import './App.css';
import MemeDetail from './components/MemeDetail';
import MemeList from './components/MemeList';
import PatrickLogo from './patrick-logo.png';


interface IState {
	currentMeme: any,
	memes: any[],
	open: boolean,
	uploadFileList: any,
	authenticated: boolean,
	refCamera: any,
	predictionResult: any
}

class App extends React.Component<{}, IState> {
	constructor(props: any) {
		super(props)
		this.state = {
			currentMeme: { "id": 0, "title": "Loading ", "url": "", "tags": "⚆ _ ⚆", "uploaded": "", "width": "0", "height": "0" },
			memes: [],
			open: false,
			uploadFileList: null,
			authenticated: false,
			refCamera: React.createRef(),
			predictionResult: null,
		}
		this.selectNewMeme = this.selectNewMeme.bind(this)
		this.fetchMemes = this.fetchMemes.bind(this)
		this.handleFileUpload = this.handleFileUpload.bind(this)
		this.uploadMeme = this.uploadMeme.bind(this)
		this.authenticate = this.authenticate.bind(this)
		this.fetchMemes("")
	}

	public render() {
		const { open, authenticated } = this.state;
		return (
			<div>

				{(!authenticated) ?
					<Modal open={!authenticated} onClose={this.authenticate} closeOnOverlayClick={false} showCloseIcon={false} center={true}>
						<Webcam
							audio={false}
							screenshotFormat="image/jpeg"
							ref={this.state.refCamera}
						/>
						<div className="row nav-row">
							<div className="btn btn-primary bottom-button" onClick={this.authenticate}>Login</div>
						</div>
					</Modal> : ""}
				{(authenticated) ?
					<div>
						<div className="header-wrapper">
							<div className="container header">
								<img src={PatrickLogo} height='40' />&nbsp; My Meme Bank - MSA 2018 &nbsp;
					<div className="btn btn-primary btn-action btn-add" onClick={this.onOpenModal}>Add Meme</div>
							</div>
						</div>
						<div className="container">
							<div className="row">
								<div className="col-7">
									<MemeDetail currentMeme={this.state.currentMeme} />
								</div>
								<div className="col-5">
									<MemeList memes={this.state.memes} selectNewMeme={this.selectNewMeme} searchByTag={this.fetchMemes} />
								</div>
							</div>
						</div>
						<Modal open={open} onClose={this.onCloseModal}>
							<form>
								<div className="form-group">
									<label>Meme Title</label>
									<input type="text" className="form-control" id="meme-title-input" placeholder="Enter Title" />
									<small className="form-text text-muted">You can edit any meme later</small>
								</div>
								<div className="form-group">
									<label>Tag</label>
									<input type="text" className="form-control" id="meme-tag-input" placeholder="Enter Tag" />
									<small className="form-text text-muted">Tag is used for search</small>
								</div>
								<div className="form-group">
									<label>Image</label>
									<input type="file" onChange={this.handleFileUpload} className="form-control-file" id="meme-image-input" />
								</div>

								<button type="button" className="btn" onClick={this.uploadMeme}>Upload</button>
							</form>
						</Modal>
					</div> : ""}
			</div>

		);
	}

	// Authenticate
	private authenticate() {
		const screenshot = this.state.refCamera.current.getScreenshot();
		this.getFaceRecognitionResult(screenshot)
	}

	// Call custom vision model
	private getFaceRecognitionResult(image: string) {
		const url = "https://southcentralus.api.cognitive.microsoft.com/customvision/v2.0/Prediction/fd195e02-cc3a-4475-b975-056bfff17778/image?iterationId=b56a26ef-a6da-4383-923d-fc3e98186959"
		if (image === null) {
			return;
		}
		const base64 = require('base64-js');
		const base64content = image.split(";")[1].split(",")[1]
		const byteArray = base64.toByteArray(base64content);
		fetch(url, {
			body: byteArray,
			headers: {
				'cache-control': 'no-cache', 'Prediction-Key': 'f2467f0b9c2a4856b664c5478c7d88c0', 'Content-Type': 'application/octet-stream'
			},
			method: 'POST'
		})
			.then((response: any) => {
				if (!response.ok) {
					// Error State
					alert(response.statusText)
				} else {
					response.json().then((json: any) => {
						console.log(json.predictions[0])
						this.setState({ predictionResult: json.predictions[0] })
						if (this.state.predictionResult.probability > 0.7) {
							this.setState({ authenticated: true })
						} else {
							this.setState({ authenticated: false })

						}
					})
				}
			})
	}

	// Modal open
	private onOpenModal = () => {
		this.setState({ open: true });
	};

	// Modal close
	private onCloseModal = () => {
		this.setState({ open: false });
	};

	// Change selected meme
	private selectNewMeme(newMeme: any) {
		this.setState({
			currentMeme: newMeme
		})
	}

	private fetchMemes(tag: any) {
		let url = "http://apiformemes.azurewebsites.net/api/meme"
		if (tag !== "") {
			url += "/tag?=" + tag
		}
		fetch(url, {
			method: 'GET'
		})
			.then(res => res.json())
			.then(json => {
				let currentMeme = json[0]
				if (currentMeme === undefined) {
					currentMeme = { "id": 0, "title": "No memes (╯°□°）╯︵ ┻━┻", "url": "", "tags": "try a different tag", "uploaded": "", "width": "0", "height": "0" }
				}
				this.setState({
					currentMeme,
					memes: json
				})
			});
	}

	private handleFileUpload(fileList: any) {
		this.setState({
			uploadFileList: fileList.target.files
		})
	}

	private uploadMeme() {
		const titleInput = document.getElementById("meme-title-input") as HTMLInputElement
		const tagInput = document.getElementById("meme-tag-input") as HTMLInputElement
		const imageFile = this.state.uploadFileList[0]

		if (titleInput === null || tagInput === null || imageFile === null) {
			return;
		}

		const title = titleInput.value
		const tag = tagInput.value
		const url = "http://apiformemes.azurewebsites.net/api/meme/upload"

		const formData = new FormData()
		formData.append("Title", title)
		formData.append("Tags", tag)
		formData.append("image", imageFile)

		fetch(url, {
			body: formData,
			headers: { 'cache-control': 'no-cache' },
			method: 'POST'
		})
			.then((response: any) => {
				if (!response.ok) {
					// Error State
					alert(response.statusText)
				} else {
					location.reload()
				}
			})
	}
}

export default App;
