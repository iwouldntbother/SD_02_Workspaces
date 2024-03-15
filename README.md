# UNIT 10 - Self-Directed Project

## Contents

- [UNIT 10 - Self-Directed Project](#unit-10---self-directed-project)
  - [Contents](#contents)
  - [Project Log](#project-log)
    - [LLM Chat Model](#llm-chat-model)
      - [Starting point](#starting-point)
    - [Text-to-Speech](#text-to-speech)
    - [Speech-to-Text](#speech-to-text)
    - [Text-to-Face](#text-to-face)
    - [Phonemes-to-3D-Animation](#phonemes-to-3d-animation)
  - [Research](#research)

## Project Log

### LLM Chat Model

#### Starting point

Initially I was planning to train my own model via transfer learning, a technique used to add extra data to an already trained model. The model in question is LLaMa2 from Meta. This model performs similarly to OpenAI's ChatGPT-3 model, the current free chat model offered by OpenAI. ChatGPT-3, ChatGPT-3.5 and ChatGPT-4 are all closed source models with web and API access. However Meta's LLaMa2 model is open-source, meaning its code and models can be used locally and can be altered in any way, following the EULA from Meta.

In the Self-Directed brief section of Unit 9, I devised and tested a method of exploring objects and systems with a systematic, 5 step process. When creating and subsequently testing this process I looked at how LLM's were censored to fit certain moral rules. While researching between step 1 and 2, I discovered an article by Katharine Miller, (Stanford, 2023), outlining an interview with Eric Mitchell. The article discuses the act of updating LLMs with more up-to-date information, in response to the question "Can a model’s outputs be corrected or updated in a way other than directly editing the model?", Mitchell states "Our lab has developed two frameworks – SERAC and ConCoRD – that leave the pre-trained model alone and instead figure out when to override the predictions of the underlying model.". He later uses an analogy of a student carrying a "back-pocket notebook" that included the information he may require, Mitchell co-authored a paper titled "Memory-Based Model Editing at scale" (Mitchell, et al. 2022), where he goes into more detail on how this framework functions.

While use of frameworks like this haven't been confirmed by popular LLMs such as OpenAI's ChatGPT or Google's PaLM 2, these frameworks, or something similar are likely being used. As Mitchell notes, "These models are better at reasoning the downstream effects of a correction", which in the common uses of LLMs today, as helpful chat-bots, the downstream effect would be valuable as well as the ability to update the model quickly with more up-to-date data.

As these frameworks are often not used in open-source LLMs and simply the pre-trained model is provided. I looked at using transfer-learning to augment the pre-trained model with less morally sound information allowing it to bypass any censorship given, in this case by Meta. Meta's LLaMA 2 model is currently one of the best performing open-source LLMs available at the time of release, beating MPT and Falcon across several benchmarks (Touvron et al., 2023).

### [Text-to-Speech](/text-to-speech/README.md)

### [Speech-to-Text](/speech-to-text/README.md)

### [Text-to-Face](/text-to-face/README.md)

### Phonemes-to-3D-Animation

## Research
