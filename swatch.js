export var swatch =
{
    props:
    [
        "color"
    ],
    data()
    {return{
        div_width:0,
        div_height:0
    }},
    methods:
    {
        onresize()
        {
            var div = this.$el;
            if(this.div_width != div.clientWidth || this.div_height != div.clientHeight)
            {
                this.draw_swatch();
            }
        },
        draw_swatch()
        {
            var div = this.$el;
            this.div_width = div.clientWidth;
            this.div_height = div.clientHeight;
            var canvas = this.$el.querySelector("canvas");
            canvas.width = this.div_width;
            canvas.height = this.div_height;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = this.color.hex;
            ctx.roundRect(0,0,canvas.width,canvas.height,[24,24,24,4]);
            ctx.fill();
        }
    },
    mounted()
    {
        this.draw_swatch();
    },
    updated()
    {
        this.draw_swatch();
    },
    template:/*html*/`
        <div v-resize="onresize">
            <canvas width='1px' height='1px'></canvas>
        </div>`
};
