export var swatch =
{
    props:
    [
        "color"
    ],
    data()
    {return{
        obv:new ResizeObserver((entries) =>
            {
                this.draw_swatch();
            })
    }},
    methods:
    {
        draw_swatch()
        {
            var div = this.$el;
            var canvas = this.$el.querySelector("canvas");
            canvas.width = div.clientWidth;
            canvas.height = div.clientHeight;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = this.color.hex;
            ctx.roundRect(0,0,canvas.width,canvas.height,[24,24,24,4]);
            ctx.fill();
        }
    },
    mounted()
    {
        this.draw_swatch();
        this.obv.observe(this.$el);
    },
    unmounted()
    {
        this.obv.disconnect();
    },
    updated()
    {
        this.draw_swatch();
    },
    template:/*html*/`
        <div>
            <canvas width='1px' height='1px'></canvas>
        </div>`
};
