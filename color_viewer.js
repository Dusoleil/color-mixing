import {color_detail} from "color_detail"
import {swatch} from "swatch"

export var color_viewer =
{
    props:
    [
        "detail",
        "color"
    ],
    data()
    {return{
        swatch_style:
        {
            width:'100%',
            '--swatch-height':'75px',
            height:'var(--swatch-height)',
            'margin-top':'calc(-0.65*var(--swatch-height))',
            'margin-bottom':'calc(-0.10*var(--swatch-height))',
            'margin-right':'-32px'
        }
    }},
    components:
    {
        "color-detail":color_detail,
        "swatch":swatch
    },
    template:/*html*/`
        <v-card elevation="10" class="mx-auto mt-16 overflow-visible">
            <swatch :color="color" class="ml-auto border-0 rounded-t-xl rounded-be-xl elevation-15" :style="swatch_style"></swatch>
            <v-card-title>{{color.name}}</v-card-title>
            <v-card-subtitle>Lab({{color.L.toFixed(2)}}, {{color.a.toFixed(2)}}, {{color.b.toFixed(2)}})</v-card-subtitle>
            <v-card-text class="d-flex ga-2">
                <color-detail :detail="detail" :color="color"></color-detail>
            </v-card-text>
        </v-card>`
};
