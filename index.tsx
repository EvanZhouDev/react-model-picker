import { useEffect, useState } from "react";
import { EmbeddingModel, ImageModel, LanguageModel, type Provider } from "ai";
import { useLocalStorage } from "@uidotdev/usehooks";
import React, { Dispatch, SetStateAction } from "react";

export function useModelPicker<
	T extends LanguageModel | EmbeddingModel<string> | ImageModel = LanguageModel
>(
	providers: { provider: () => Provider; name: string; models: string[] }[],
	options?: {
		modelType?: ModelType;
		useLocalStorage?: boolean;
	}
) {
	const { modelType = ModelType.Language, useLocalStorage: useLS = false } =
		options || {};

	// Create a custom hook for storage that either uses localStorage or regular state
	function useStorage<T>(
		key: string,
		initialValue: T
	): [T, Dispatch<SetStateAction<T>>] {
		return useLS
			? useLocalStorage<T>(key, initialValue)
			: useState<T>(initialValue);
	}

	const [apiKeyMap, setApiKeyMap] = useStorage<{ [key: string]: string }>(
		"apiKeyMap",
		{}
	);
	const [preferredModelMap, setPreferredModelMap] = useStorage<{
		[key: string]: string;
	}>("preferredModelMap", {});

	// Create provider map
	const providerMap = new Map<
		string,
		{
			provider: (config: any) => Provider;
			models: string[];
		}
	>();

	for (const provider of providers) {
		providerMap.set(provider.name, {
			provider: provider.provider,
			models: provider.models,
		});
	}

	let getModel = () => {
		const provider = providerMap.get(selectedProvider)?.provider({
			apiKey,
		});

		switch (modelType) {
			case ModelType.Language:
				return provider!.languageModel(modelId);
			case ModelType.Embedding:
				return provider!.textEmbeddingModel(modelId);
			case ModelType.Image:
				return provider!.imageModel(modelId);
			default:
				return provider!.languageModel(modelId);
		}
	};

	const [selectedProvider, setSelectedProvider] = useStorage<string>(
		"provider",
		providers[0].name
	);
	const [apiKey, setApiKey] = useState<string>("");
	const [modelId, setModelId] = useStorage<string>(
		"modelId",
		providers[0].models[0]
	);
	const [model, setModel] = useState<T>(getModel() as T);

	useEffect(() => {
		const provider = providerMap.get(selectedProvider)?.provider({
			apiKey,
		});

		if (provider) {
			switch (modelType) {
				case ModelType.Language:
					setModel(provider.languageModel(modelId) as T);
					break;
				case ModelType.Embedding:
					setModel(provider.textEmbeddingModel(modelId) as T);
					break;
				case ModelType.Image:
					setModel(provider.imageModel(modelId) as T);
					break;
				default:
					setModel(provider.languageModel(modelId) as T);
					break;
			}
		}
	}, [apiKey, selectedProvider, modelId]);

	useEffect(() => {
		if (preferredModelMap[selectedProvider])
			setModelId(preferredModelMap[selectedProvider]);
		else {
			setModelId(providerMap.get(selectedProvider)!.models[0]);
		}

		if (apiKeyMap[selectedProvider]) {
			setApiKey(apiKeyMap[selectedProvider]);
		} else {
			setApiKey("");
		}
	}, [selectedProvider]);

	useEffect(() => {
		setApiKeyMap((prev) => ({
			...prev,
			[selectedProvider]: apiKey,
		}));
	}, [apiKey]);

	useEffect(() => {
		setPreferredModelMap((prev) => ({
			...prev,
			[selectedProvider]: modelId,
		}));
	}, [modelId]);

	return {
		apiKey,
		setApiKey: (value: string) => setApiKey(value),
		modelId,
		setModelId: (value: string) => setModelId(value),
		selectedProvider,
		setSelectedProvider: (value: string) => setSelectedProvider(value),
		providerList: providers,
		modelIdList: providerMap.get(selectedProvider)?.models || [],
		model,
	};
}

export enum ModelType {
	Embedding = "embedding",
	Language = "language",
	Image = "image",
}

export interface ModelPickerProps {
	providers: { provider: () => Provider; name: string; models: string[] }[];
	options?: {
		modelType?: ModelType;
		useLocalStorage?: boolean;
	};
	onModelChange?: ((model: any) => void) | Dispatch<SetStateAction<any>>;
	children?: React.ReactNode;
}

export function ModelPicker<
	T extends LanguageModel | EmbeddingModel<string> | ImageModel
>({ providers, options, onModelChange, children }: ModelPickerProps) {
	const {
		providerList,
		selectedProvider,
		setSelectedProvider,
		apiKey,
		setApiKey,
		modelIdList,
		modelId,
		setModelId,
		model,
	} = useModelPicker<T>(providers, options);

	// State for the toggle between dropdown and text input
	const [useCustomModelInput, setUseCustomModelInput] = useState(false);

	useEffect(() => {
		if (!modelIdList.includes(modelId)) setUseCustomModelInput(true);
		else setUseCustomModelInput(false);
	}, [modelId]);

	useEffect(() => {
		if (!useCustomModelInput) {
			setModelId(modelIdList[0]);
		}
	}, [useCustomModelInput]);

	useEffect(() => {
		if (onModelChange) {
			onModelChange(model);
		}
	}, [model, onModelChange]);

	// Default UI for the model picker
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "20px",
				padding: "20px",
				maxWidth: "400px",
			}}
		>
			<div>
				<label
					htmlFor="provider-select"
					style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}
				>
					Provider:
				</label>
				<select
					id="provider-select"
					value={selectedProvider}
					onChange={(e) => setSelectedProvider(e.target.value)}
					style={{
						width: "100%",
						padding: "10px",
						borderRadius: "8px",
						paddingTop: "12px",
						paddingBottom: "12px",
						border: "1px solid #e2e2e2",
						fontSize: "16px",
					}}
				>
					{providerList.map((p) => (
						<option key={p.name} value={p.name}>
							{p.name}
						</option>
					))}
				</select>
			</div>

			<div>
				<label
					htmlFor="api-key"
					style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}
				>
					API Key:
				</label>
				<input
					id="api-key"
					type="password"
					value={apiKey}
					onChange={(e) => setApiKey(e.target.value)}
					placeholder="Enter API Key"
					style={{
						width: "100%",
						padding: "10px",
						borderRadius: "8px",
						border: "1px solid #e2e2e2",
						fontSize: "16px",
						boxSizing: "border-box",
					}}
				/>
			</div>

			<div>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "8px",
					}}
				>
					<label
						htmlFor={useCustomModelInput ? "model-input" : "model-select"}
						style={{ fontWeight: 500 }}
					>
						Model:
					</label>
					<div
						onClick={() => setUseCustomModelInput(!useCustomModelInput)}
						style={{
							display: "flex",
							alignItems: "center",
							cursor: "pointer",
							fontSize: "14px",
							color: "#666",
						}}
					>
						<span>
							{useCustomModelInput ? "Pick Model" : "Use Custom Model"}
						</span>
						<div
							style={{
								marginLeft: "8px",
								width: "36px",
								height: "20px",
								backgroundColor: useCustomModelInput ? "#1A87FF" : "#e2e2e2",
								borderRadius: "10px",
								position: "relative",
								transition: "background-color 0.2s",
							}}
						>
							<div
								style={{
									position: "absolute",
									left: useCustomModelInput ? "18px" : "2px",
									top: "2px",
									width: "16px",
									height: "16px",
									borderRadius: "50%",
									backgroundColor: "white",
									transition: "left 0.2s",
								}}
							/>
						</div>
					</div>
				</div>

				{useCustomModelInput ? (
					<input
						id="model-input"
						type="text"
						value={modelId}
						onChange={(e) => setModelId(e.target.value)}
						placeholder="Enter model ID"
						style={{
							width: "100%",
							padding: "10px",
							borderRadius: "8px",
							border: "1px solid #e2e2e2",
							fontSize: "16px",
							boxSizing: "border-box",
						}}
					/>
				) : (
					<select
						id="model-select"
						value={modelId}
						onChange={(e) => setModelId(e.target.value)}
						style={{
							width: "100%",
							padding: "6px",
							paddingTop: "12px",
							paddingBottom: "12px",
							borderRadius: "8px",
							border: "1px solid #e2e2e2",
							fontSize: "16px",
						}}
					>
						{modelIdList.map((m) => (
							<option key={m} value={m}>
								{m}
							</option>
						))}
					</select>
				)}
			</div>
		</div>
	);
}
