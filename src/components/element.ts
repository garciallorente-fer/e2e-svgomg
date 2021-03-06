import { ElementHandle, JSHandle } from 'playwright-core'
import waitForExpect from 'wait-for-expect'


export class Element {

    protected readonly selector: string
    protected readonly parentSelector: string

    protected readonly disabledProperty = 'disabled'
    protected readonly classNameProperty = 'className'
    protected readonly valueProperty = 'value'
    protected readonly hiddenProperty = 'hidden'


    constructor(selector: string, parentSelector?: string) {
        this.selector = parentSelector ? `${parentSelector} ${selector}` : selector
        this.parentSelector = parentSelector ? `${parentSelector}:has(${selector})` : undefined
    }

    protected readonly timeoutElement = 35000


    protected async getElement(): Promise<ElementHandle<SVGElement | HTMLElement>> {
        return await page.waitForSelector(this.selector, { state: 'attached', timeout: this.timeoutElement })
    }

    protected async getElements(): Promise<ElementHandle<SVGElement | HTMLElement>[]> {
        await page.waitForSelector(this.selector, { state: 'attached', timeout: this.timeoutElement })
        return await page.$$(this.selector)
    }

    protected async getElementByInnerHtml(innerHtmls: string[]): Promise<ElementHandle<SVGElement | HTMLElement>> {
        const elementInnerHtmls: string[] = []
        const elements = await this.getElements()
        for (const element of elements) {
            const elementInnerHtml = await element.innerHTML()
            elementInnerHtmls.push(elementInnerHtml)
            if (innerHtmls.every(innerHtml => elementInnerHtml.toLowerCase().includes(innerHtml.toLowerCase()))) {
                return element
            }
        }
        throw new Error(`None of these innerHtmls: ${innerHtmls} >> were found in these elementInnerHtmls: ${elementInnerHtmls}`)
    }

    protected async getElementByValue(values: string[]): Promise<ElementHandle<SVGElement | HTMLElement>> {
        const elements = await this.getElements()
        for (const element of elements) {
            const propertyValue: string = (await (await element.getProperty(this.valueProperty)).jsonValue()).toString().toLowerCase()
            if (propertyValue.includes(values[0].toLowerCase()) && (!values[1] || propertyValue.includes(values[1].toLowerCase()))) {
                return element
            }
        }
    }

    protected async getParentElement(): Promise<ElementHandle<SVGElement | HTMLElement>> {
        return await page.waitForSelector(this.parentSelector, { state: 'attached', timeout: this.timeoutElement })
    }


    public async getElementProperty<T>(properties: string[]): Promise<T> {
        let propertyHandle = await this.getElement() as JSHandle
        for (const property of properties) {
            propertyHandle = await propertyHandle.getProperty(property)
        }
        const propertyValue: T = await propertyHandle.jsonValue()
        return propertyValue
    }


    public async exists(state?: { hidden?: true, disabled?: true }): Promise<void> {
        await this.checkHiddenState(state?.hidden)
        await this.checkDisabledState(state?.disabled)
    }


    protected async checkHiddenState(hidden?: true): Promise<void> {
        const element = await this.getElement()
        try {
            if (hidden) {
                if (await element.isVisible()) {
                    await waitForExpect(async () => {
                        expect(await this.getElementProperty<string>([this.classNameProperty])).toContain(this.hiddenProperty)
                    }, this.timeoutElement)
                    return
                }
                await waitForExpect(async () => {
                    expect(await element.isHidden()).toBeTruthy()
                }, this.timeoutElement)
            } else {
                await waitForExpect(async () => {
                    expect(await element.isVisible()).toBeTruthy()
                }, this.timeoutElement)
            }
        } catch (error) {
            error.message = 'Hidden=' + hidden + ' > ' + error.message + ' > ' + this.selector
            throw new Error(error.message)
        }
    }


    protected async checkDisabledState(disabled?: true): Promise<void> {
        const element = await this.getElement()
        const isEnabled = await element.isEnabled()
        const isEditable = await element.isEditable()
        try {
            if (disabled) {
                if (isEnabled && isEditable) {
                    await waitForExpect(async () => {
                        expect(await this.getElementProperty<string>([this.classNameProperty])).toContain(this.disabledProperty)
                    }, this.timeoutElement)
                    return
                }
                await waitForExpect(async () => {
                    expect(await element.isDisabled() || !await element.isEditable()).toBeTruthy()
                }, this.timeoutElement)
                return
            }
            await waitForExpect(async () => {
                expect(await element.isEnabled()).toBeTruthy()
            }, this.timeoutElement)
            await waitForExpect(async () => {
                expect(await this.getElementProperty<string>([this.classNameProperty])).not.toContain(this.disabledProperty)
            }, this.timeoutElement)
        } catch (error) {
            error.message = 'Disabled=' + disabled + ' > ' + error.message + ' > ' + this.selector
            throw new Error(error.message)
        }
    }


    public async checkActive(isActive: boolean): Promise<void> {
        try {
            isActive ?
                await waitForExpect(async () => {
                    expect(await this.getElementProperty<string>([this.classNameProperty])).toContain('active')
                }, this.timeoutElement)
                :
                await waitForExpect(async () => {
                    expect(await this.getElementProperty<string>([this.classNameProperty])).not.toContain('active')
                }, this.timeoutElement)
        } catch (error) {
            error.message = 'Active=' + isActive + ' > ' + error.message + ' > ' + this.selector
            throw new Error(error.message)
        }
    }


    public async checkFocused(isFocused: boolean): Promise<void> {
        try {
            isFocused ?
                await waitForExpect(async () => {
                    expect(await this.getElementProperty<string>([this.classNameProperty])).toContain('focused')
                }, this.timeoutElement)
                :
                await waitForExpect(async () => {
                    expect(await this.getElementProperty<string>([this.classNameProperty])).not.toContain('focused')
                }, this.timeoutElement)
        } catch (error) {
            error.message = 'Focused=' + isFocused + ' > ' + error.message + ' > ' + this.selector
            throw new Error(error.message)
        }
    }


    public async notExists(): Promise<void> {
        await page.waitForSelector(this.selector, { state: 'detached', timeout: this.timeoutElement })
    }

}
